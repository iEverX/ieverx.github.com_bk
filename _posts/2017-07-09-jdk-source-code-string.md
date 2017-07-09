---
layout: post
title: JDK源码阅读之String
tags: [Java, JDK, 源码, String]
---

这几天看了看Java的`String`的实现。Java中的所有的`String`字面量都是`String`类的实例。
文件注释中写到了，字面量生命`String s = "abc"`和
```java
char[] data = new char[]{'a', 'b', 'c'};
String s = new String(data)
```
效果是一样的。这应该是JVM来实现的。

## 接口
`String`实现了三个接口，分别是`Serializable`，`Comparable<String>`和`CharSequence`。
`Serializable`用于序列化，`Comparable<String>`用于比较，
`CharSequence`则是`String`的一个更通用的抽象。

## 属性
`String`最重要的属性是`private final char value[]`，`value`中存放着`String`的实际内容。
此外，Java的`char`的长度是16bit，两个字节。
另外一个属性是`private int hash`，是`String`得哈希值，默认为0。`hash`在调用`hashCode()`时计算，
因此不是`final`。

## 构造方法
`String`的构造方法分为几类
* 无参构造方法，得到的就是空的字符串
* 参数是`String`的，直接对`value`和`hash`赋值
* `char[]`相关的，这类方法进行越界检查，由于`String`是不可变的，还会复制数组
* `int[]`相关的，这里的参数是Unicode的codePoint，因为Unicode是4字节的，所以使用了`int`。
  对于基本平面（BMP）的字符，只需要`char`即可。对于辅助平面的字符，一个codePoint，需要两个`char`才能存下。
* `byte[]`相关的，所有从`byte[]`转为`String`的，都需要指明编码格式。
  曾经有过不需要指明编码格式的方法，但是现在已经`Deprecated`了，因为有bug。
* `StringBuilder`和`StringBuffer`，具体实现上都是复制数组，`StringBuffer`加了锁
* `String(char[] value, boolean share)`，这是一个特殊的构造方法，这个方法可访问性是包内可见。
  为了性能上的考量，实现上不做数组复制，只是简单的赋值。调用的时候，`share`一定是`true`。

## 方法

所有方法方法中，涉及到可能产生新的字符串的，都会先检查参数，是否可以直接返回自身。

* `length`直接返回`value.length`
* `isEmpty`判断`value.length == 0`
* `hasCode`返回`hash`，如果没有计算过，用times31算法计算，并保存结果
* `equals`，不比较`hashCode`，直接按序比较字符
* 其他比较相关的方法，
  * 定义了内部静态类`CaseInsensitiveCompartator`，用于处理大小写不敏感的比较
  * 基本上都是从前向后遍历
  * `compareTo`方法是按照Unicode字典序比较的，有不同则返回不同的字符的差，否则返回长度的差
* `indexOf(int ch, int fromIndex)`
  * `indexOf(ch) == indexOf(ch, 0)`
  * 先判断ch，如果是负值（非法值）或者BMP字符，从前到后扫一遍
  * 否则是辅助平面字符，从前到后扫，比较前导代理以及后尾代理
* `indexOf(String s, int fromIndex)`
  * 实现上，先找到第一个字符，然后比较余下字符。不断循环
  * 效率上比较低下，[stackoverflow][]有个讨论，我觉得还是有道理的
* `contains`，判断`indexOf() > -1`
* `matches`，调用`Pattern.matches`
* `split(String regex, int limit)`
  * `limit`表示分割后的数组的长度，若0，表示不限制结果的个数。默认为0
  * 实现上，如果`regex`是简单的字符串
    * 单个字符，并且不是正则表达式的元字符
    * 两个字符，第一个是`'\\'`，并且第二个不是ascii字母和数字
    * 从前到后扫，调用`indexOf`
  * 否则调用Pattern
  * 空的字符串会返回
  * 但是，`split`方法有个坑，就是最后一个分隔符后面如果没有其他字符，那么是没有最后一个空字符串的
    * `"hello,,yes,".split(",") == ["hello", "", "yes"]`
* `join`，静态方法，调用`StringJoiner`
  * `null`会按照`"null"`处理
* `concat(str)`，不检查参数，如果为`null`会报异常，如果`str.length != 0`，开辟新的数组。
  * 只调用一次数组复制，
* `substring`，检查之后复制数组。之前某个版本好像是没有复制数组，导致了内存泄漏
* `trim`，实现上是去除了前后的所有ascii码小于等于20的字符
* `replace`
  * 字符替换，如果相同或者未发现，直接返回，否则遍历
  * 字符串替换，调用`Pattern`
* 大小写转换相关方法的实现，考虑的东西比较多，实现比较复杂。涉及了`Locale`，未知名则使用系统默认的。
  不同的语种，大小写规则不太一样，调用了`ConditionalSpecialCasing`进行实际的转换
* `toString`，返回自己
* `toCharArray`，调用`System.arraycopy`产生新的数组
* `valueOf`系列
  * `char[]`，调用构造函数
  * `Object`，`"nul"`或者`toString()`
  * 内置类型，直接调用响应的`toString()`
* `native intern()`，将自身添加到字符串池



[stackoverflow]: https://stackoverflow.com/questions/19543547/why-jdks-string-indexof-does-not-use-kmp
