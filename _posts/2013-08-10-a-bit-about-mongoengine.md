---
layout: post
title: "尝试MongoEngine"
tagline: "A Bit About Mongoengine"
description: "使用MongoDB以及MongoEngine的一些想法"
tags: [MongoDB, Python]
---

MongoEngine之于MongoDB来说，就类似于SQLAlchemy之于关系型数据库，是ODM。许多人对于MongoDB之类的文档型数据库，不愿意用ODM，认为会拖累速度，而且似乎是又回到了关系型数据库。对于此，我只能说，我是支持使用ODM的，因为我确实感觉到ODM给我的编程提供了许多便利。

回到MongoEngine，使用MongoEngine，首先要有定义数据库模式，如下


    from mongoengine import *

    class User(Document):
        id = SequenceField(primary_key=True)
        name = StringField(unique=True)

    class Reply(EmbeddedDocument):
        user = ReferenceField('User', required=True)
        content = StringField()
        time = DateTimeField(default=dt.utcnow())

    class Article(Document):
        title = StringField(required=True)
        author = ReferenceField('User', dbref=True)
        content = StringField()
        replies = ListField(EmbeddedDocumentField(Reply))
        create_time = DateTimeField(default=dt.utcnow())
        update_time = DateTimeField()


以上的几个类，就完全可以表示一个博客系统的数据库模式，包括了用户、文章、和回复。其中User和Article是两个独立的实体，而回复则是文章的一个属性，所以回复不是一个完整的实体，因此是一个EmbeddedDocument的类型，表示内嵌文档。而Document类的子类会在MongoDB中建立一个collection。这样，以上的模型最终的collection是两个，user和article。关于正常模型，还有几点要说的地方

* SequenceField是一个自增字段。MongoDB本身不提供自增字段，其实现方法一般是findAndModify方法，看这里[Create an Auto-Incrementing Sequence Field][autoinc]
* ReferenceField表示一个引用，类似于关系型数据库的外键，其中dbref默认为False，表示在建立的模型中，这个字段只保存对应的文档记录的主键，为True则表示存储为dbref（关于dbref，可以看着里[Database References][dbref]），查询的时候，MongoEngine会自动帮你把这个字段的东西取出来
* DateTimeField，MongoDB中的时间没有时区，所以保存为UTC时间是最好的选择

之后，查询就比较简单了，比如在首页，想要显示全部的文章，

    articles = Article.objects

就是全部的文章的生成器，排序或者限定结果数量，可以这样

    articles = Article.objects.order_by('-create_time').skip(10).limit(10)
    
这表示取按创建时间降序排列的第10到第20篇文章。而现在，如果要显示作者的信息，则可以用`article.author.name`来表示作者的名字，`article`是`Article`类的实例。而添加回复，也很简单

    r = Reply(user=User(id=1)) # 必须用主键表明User，或者可以从数据中选择一个User的实例
    r.content = 'xxxxxxxxxx'
    article.replies.append(r) # 如果原本没有回复，article.replies是[]
    article.save()
    
MongoEngine简化了程序员的劳动，相比于直接用PyMongo操纵MongoDB，程序员可以把一些重复性的代码直接交给MongoEngine，自己只需关心数据的逻辑即可。之前用SQL的时候，感觉ORM好麻烦，不灵活，结果数据层搞得一团糟。而且，貌似MongoEngine带来的性能损失是在可接受范围内，不会对程序的性能造成太大影响。当然，如果觉得自己完全可以驾驭PyMongo，自己写数据模型，当然也是没问题的。

[dbref]: http://docs.mongodb.org/manual/reference/database-references/
[autoinc]: http://docs.mongodb.org/manual/tutorial/create-an-auto-incrementing-field/

