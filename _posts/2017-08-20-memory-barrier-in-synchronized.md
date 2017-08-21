---
layout: post
title: Synchronized的内存屏障
tags: [Java, 并发]
---

## 问题

在V2EX上看到这样[一个问题][]，具体来说，就是下面这份代码，注释和不注释，为什么运行会有不同
```java
public class MyRun implements Runnable {

	private boolean stop;

	MyRun(boolean status) {
		this.stop = status;
	}

	@Override
	public void run() {
		while(!stop) {
			// System.out.println("running");
		}
		System.out.println("stop");
	}

	public void setStop(boolean stop) {
		this.stop = stop;
	}
}

// 测试代码
MyRun myRun = new MyRun(false);
new Thread(myRun).start();
Thread.sleep(1000); // 等待线程执行
myRun.setStop(true);
```

这个代码目的就是通过主线程修改变量，控制子线程的运行。
为了这个目的，很显然`stop`需要添加`volitale`关键字，表明`stop`是多线程可见的。
那么，子线程在读取`stop`的时候，会从先把主内存的变量同步到自己的工作内存，然后再使用，
因而可以拿到最新的`stop`的值。

抛开`volatile`不谈，单独这份代码，注释和不注释下，运行结果也有很大差异。
* 注释的情况下，子线程没有得到`stop`的最新值，其工作内存中的`stop`一直是`false`，因此程序死循环。
这和预期情况一致。
* 不注释的情况下，程序会一直输出`running`，知道1秒后，输出`stop`。显然子线程获得到了`stop`的最新值。
  这里的我就不太理解了，为什么呢？

## `syncronized`
最开始我以为是IO引起的用户态内核态切换，会导致从主存中同步，不过查了一圈资料，这个猜想是错误的。

`println`函数在jdk里的实现是这样的
```java
public void println(String x) {
    synchronized (this) {
        print(x);
        newLine();
    }
}
```
里面有个`synchronized`，估计就是和这个有关了。

手头有本《深入理解Java虚拟机》（简称书），里边关于Java的内存模型，
有这样的说法
> 同步块的可见性是由“对一个变量执行unlock操作之前，必须先把此变量同不会主内存中（执行store、wirte操作）”这条规则获得的。

但是这个说法和这里用法不一样，因为书中说法，意思是退出同步块之前，要把`synchronized`的对象同步会主内存。
而本问题中，同步块锁住的对象`this`，是指`System.out`这个对象，并不是`myRun`。

在[JSR 133 FAQ][]中，有如下说法
> Before we can enter a synchronized block, we acquire the monitor, which has the effect of invalidating the local processor cache so that variables will be reloaded from main memory. We will then be able to see all of the writes made visible by the previous release.

这说明`synchronzed`可以是使本地CPU缓存失效，从而从主内存中读取最新的变量值。
但是后面的有一个*Important Note*，表明只有释放和获取的是同一把锁，才能保证**happen before**关系，
又让我对这段胡的理解产生了疑问。
在stackoverflow上，有一个关于这段话的[提问][]，但是并没有让我更明白。

之后又去看Java语言规范中关于内存模型的部分。
在[Java语言规范17.1节][JLS17.1]，关于`synchronized`块，有如下说明
> attempts to perform a lock action on that object's monitor and does not proceed further until the lock action has successfully completed  

这里的一个重点是**lock action**，这章中只说明lock的意思是locking a monitor，并没有具体的解释。
书中写到Java内存模型有8个操作，其中一个就是`lock`，但是Java语言规范中并没有相关说明。
最后在[Java6的虚拟机规范第8章][jvm6]中，才找到对其的说明，并有一个对于本问题的重要的规则

> Let T be any thread, let V be any variable, and let L be any lock. There are certain constraints on the operations performed by T with respect to V and L:  
> Between a lock operation by T on L and a subsequent use or store operation by T on a variable V, an assign or load operation on V must intervene; moreover, if it is a load operation, then the read operation corresponding to that load must follow the lock operation, as seen by main memory. (Less formally: a lock operation behaves as if it flushes all variables from the thread's working memory, after which the thread must either assign them itself or load copies anew from main memory.)

这个规则说明，`synchronized`可以保证其工作内存中的变量都是最新版本。对于本问题，对`System.out`的锁，
更新了工作内存中的值，从而退出循环。

不过，在Java7和Java8的虚拟机规范中，这一章被移除了，并将相应的内容放到了Java语言规范中，
也就是上文所引用的[第17章][JLS17.1]中。但是我并没有在其中找到与这个规则具有相同意义的规则。
不知道哪里漏了。

## 变体

把问题中的`run`方法改一下，变成
```java
public void run() {
    while(!stop) {
        try {
            Thread.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    System.out.println("stop");
}
```
实际上也是会最后输出`stop`的。但是Java语言规范中明确表示，
> It is important to note that neither Thread.sleep nor Thread.yield have any synchronization semantics. In particular, the compiler does not have to flush writes cached in registers out to shared memory before a call to Thread.sleep or Thread.yield, nor does the compiler have to reload values cached in registers after a call to Thread.sleep or Thread.yield.

也就是说`Thread.sleep`是不需要刷新工作内存的。
但是这里仍然打印了`stop`，说明在某种情况下，线程冲主内存同步了变量。
由于这并不是Java的规范，所以这是和JVM的具体实现相关，因此并不能依赖于这一点。

## 总结

Java的内存模型之前看过，但是并不是非常清楚。这次前后查了好多，也有了更多的理解。
并且还有个问题并没有搞清楚，Java8的规范里，哪条规则能够明确的推导出Java6关于lock的规则。
这个就慢慢再看吧

## Updated

原贴下有贴出了[一个连接][]，感觉说得刚靠谱。JVM虚拟机做了优化，会尽可能的保障工作内存与主内存的同步。
这样就解释了`synchronized`和`sleep`时，线程能够获取到最新变量。

想想还是太naive了，还是要多学多看啊


[一个问题]: https://www.v2ex.com/t/384263
[JSR 133 FAQ]: https://www.cs.umd.edu/~pugh/java/memoryModel/jsr-133-faq.html#synchronization
[提问]: https://stackoverflow.com/questions/1850270/memory-effects-of-synchronization-in-java
[JLS17.1]: http://docs.oracle.com/javase/specs/jls/se8/html/jls-17.html#jls-17.1
[jvm6]: https://docs.oracle.com/javase/specs/jvms/se6/html/Threads.doc.html
[一个链接]: http://www.cnblogs.com/cookiezhi/p/5774583.html