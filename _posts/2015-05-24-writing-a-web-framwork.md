---
layout: post
title: "写一个Web框架"
tagline: "Wrting A Web Framework"
description: ""
tags: [Python, Web Framework]
---

在知乎上偶然看到了廖雪峰老师的网站上的Python教程，[Python实战][]，目的是从头开始写一个博客。这个从头开始是，自己造轮子，包括ORM、Web框架。对于写好框架之后的写博客等前端部分，我没有什么兴趣，而最前面的几个，都是我不清楚具体实现的，跟着教程一步一步往下走。说明一点，教程用的Python2，我用的是Python3，所以有些地方是略有区别的。

第一部分是编写数据API，这个部分比较简单，只要了解Python的装饰器，写的过程中，查一下mysql-connector-pyhton的文档，没有什么难度。

第二部分ORM，想要写一个功能比较完整的ORM，比较不容易。但是如果目标仅仅是可用，能够实现基本功能，难度并不太大。网站下的评论，说这一章有难度，主要都是集中在Python的metaclass，也就是元类上。我自己对元类也是不懂，查到了这篇文章，[深刻理解Python中的元类(metaclass)][metaclass]，英文原文是Stack Overflow上的一个回答，[What is a metaclass in Python?][metaclass_eng]。

我自己的理解，元类就是创建类的类，它控制一个类如何被创建。在Python中，有个Built-in的`type`类，可以像函数一样调用，当传给它三个函数时，就会创建一个新的类型

```python
class A:
    t = 1
A = type('A', (object,), {'t':1})
```

上面代码中，两块代码的作用是一样的。传递给`type`的三个参数，分别是类型名，父类型(必须为元组)，类变量和类方法的字典。可以认为，如果不指定元类，那么`type`则充当类型的元类。而如果想要控制一个类型的创建，就需要自定义元类，通过元类来创建对象。文章中也说了，元类不一定是类，任意可以可以被调用(callable)的对象都可以作为元类。

Python中有个`__new__`方法，这个方法的目的控制一个对象的创建，通过重写`__new__`就可以对一个类型创建进行自定义。比如教程里的`ModelMetaclass`

```python
class ModelMetaclass(type):
    def __new__(mcs, name, bases, attrs):
        if name == 'Model':
            return super(ModelMetaclass, mcs).__new__(name, bases, attrs)
        mapping = [x: y for x, y in attrs.items() if isinstance(y, Field)]
        table = attrs['__table__']
        real_attrs = {
            '__mapping__': mapping,
            '__table__': table,
        }
    return super(ModelMetaclass, mcs).__new__(name, bases, real_attrs)
```

其中`mapping`是名称和类型的映射，通过这个元类，作为基类的`Model`，其创建过程保持不动，而实际的与数据库表相映射的类型，在创建时，其类变量均被放进`mapping`中。实际进行实例化时，给定的实际上是实例变量，其数据库属性可以在mapping中找到，也就是实现了数据库类型的和Python类型的映射。在ORM里，这一步是最重要的。此外，在赋值时，可以通过`mapping`来检验变量类型与定义时的数据库类型是否匹配。

至于后面的Web框架，我还没有写完，不过根据网站上的代码架构，在适当填补一些需要的代码，比如路由表等，应该就没有大问题。当然，我在写的过程中，遇到了一些麻烦，比如对于跳转的实现不理解，现在好像明白了，实现跳转，只需要在`response`中设置`Location`的头部就行了，不过现在没有环境，不能确认是否是这样实现。

另外就是，由于网站上只给出了一个大致的架构，自己写出类的框架和网站github上给出的，可能会有比较大的不同。

[Python实战]: http://www.liaoxuefeng.com/wiki/001374738125095c955c1e6d8bb493182103fac9270762a000/001397616003925a3d157284cd24bc0952d6c4a7c9d8c55000
[metaclass]: http://blog.jobbole.com/21351/
[metaclass_eng]: http://stackoverflow.com/questions/100003/what-is-a-metaclass-in-python