---
layout: post
title: 利用注解实现依赖注入
tags: [Java, 依赖注入, 注解]
---

## 准备

### 依赖注入是啥？

提到依赖注入（Denpendency Injection，DI），得先讲控制反转（Inversion of Control，IoC）。控制反转是一种设计原则，目的是去除代码的去耦合。通常写程序，我们会在类中实例化所需的对象，比如说

```java
class Car {
    Tier tier = new Tier("A");
}
```

这里，`Tier`就是`Car`的一个依赖。像这种代码会造成一个问题，那就是`Tier`和`Car`之间是耦合在一起的。假如`Tier`的实现变了，增加了新的构造函数，原来的无参构造函数不满足`Car`的需求，那么就还需要修改`Car`的代码。如果换个方式，把代码改成下面这样

```java
class Car {
    Tier tier;
    public void setTier(Tier tier) {
        this.tier = tier;
    }
}
```

那么就可以通过事先实例化一个`Tier`对象，通过`setTier`方法传给`Car`对象，`Car`的代码完全不需要修改。这就是控制反转，所谓反转，意思是依赖的控制被反转了。之前，依赖的生成有对象控制，现在依赖的生成由外层代码控制。上面的采用`set`方法的方式就称为依赖注入，还可以通过构造函数，或者通过接口实现。

### 注解

注解（Annotation）是Java在1.5版本提供的特性，通过注解可以给JVM提供额外的信息。这些额外的信息，可以在运行时获取，从而改变代码的行为。

## 代码实现

为了实现依赖注入，需要有以下几个东西

* 标识一个属性通过外部注入的注解
* 根据注解注入对象的代码
* 一个保存组件的容器，以及生成的组件

其中最后一点就是Spring中的`component-scan`功能，不过我不会实现，所以本文的最后一点是手工完成的。

### 注解

代码很简单

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Inject {
    String value() default "";
}
```

这就OK了，一个注解就是这么简单。这里声明了一个名为`Inject`的注解，其关键字为`@interface`。与普通的接口不一样的地方是，不允许有属性，只能有方法，且方法不能有参数。此外，方法后可以跟一个`default`说明默认值。

在注解之上的`Target`，`Retention`，`Documented`同样是注解，这些注解称为“元注解”，共有4个，除了以上三个还有一个`Inherited`。元注解用于对注解进行类型说明。

* `Target`指明注解的使用范围，这里的`ElementType.FIELD`表明`Inject`可以注解属性，可选的值还包括`TYPE`，`PARAMETER`等
* `Retention`指明注解的保留期限，`RUNTIME`表明在运行时可以获取注解信息。可选值还有`SOURCE`和`CLASS`，分别表示在源码和字节码中保留注解信息
* `Documented`用来指明注解应该被文档化，指示javadoc之类的工具应该生成该注解的文档
* `Inherited`指明注解可以被继承

`Inject`的定义很简单，其实可以更简单，那就是直接用Java自带的注解，比如`Resource`。因为注解本身不提供功能，注解功能的实现是由其他代码读取注解信息从而完成的。

### 使用注解

```java
public class Car {

    @Inject
    private Tier tier;
    
    @Inject("james")
    private Driver driver;

    public void run() {
        System.out.println("A car is running, driver is " + driver.getName() + ", and its tier's brand is " + tier.getName());
    }
}
```

`Tier`的注解没有参数，说明给的是默认值，`driver`的注解加了参数，但是没有指明是哪个参数，这种情况下，默认使用`value`，当有多个参数时，不允许省略value。

### 读取注解并注入

```java
static void inject(Object obj, Map<String, Object> container) {
    Field[] fields = obj.getClass().getDeclaredFields();
    for (Field field : fields) {
        field.setAccessible(true);
        Inject inject = field.getAnnotation(Inject.class);
        if (inject != null) {
            String name = inject.value();
            if (name.isEmpty()) {
                name = field.getName();
            }
            if (!container.containsKey(name)) {
                throw new RuntimeException("Object \"" + name + "\" cannot be found in container.");
            }
            try {
                field.set(obj, container.get(name));
            } catch (IllegalAccessException e) {
                // ignore
            }
        }
    }
}
```

这段代码通过反射获取一个类的所有字段，并获取字段上的Inject注解。如果有注解的情况下，依次根据注解的`value`以及属性的名字获取注入的对象名。并通过发射将对象赋给相应的属性。

### 实际运行

```java
Map<String, Object> container = new HashMap<String, Object>();
container.put("james3", new Driver());
container.put("tier", new Tier());

Car car = new Car();
inject(car, container);
car.run();
```

在这里，通过`inject`方法将container中的对象根据需要注入到`car`中，无需`car`去管理对象的生成。注意到，这里的对象实例化都是有自己手动完成的。而且在实例化`car`时，依然自己手动调用了`inject`方法。所以这里简略的实现了一个依赖注入。为了自动实现以上想法，需要把`car`也放到`container`中。而`container`也应自动生成，可以通过扫描指定的包下的类来实现。个人感觉这里比较负责，不是很好写。具体可以参考Spring的实现。

## 总结
使用注解可以极大的增强代码的灵活性，而且使用注解也并不复杂，通过几个简单地API就可以完全搞定，真的是so easy！