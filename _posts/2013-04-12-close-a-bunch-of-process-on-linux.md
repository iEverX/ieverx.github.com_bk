---
layout: post
title: "Linux下关闭多个进程"
tagline: "Close A Bunch Of Process On Linux"
description: ""
tags: [Linux, shell]
---

很多时候，需要同时关闭一系列的有着相同的关键字的进程，比如说，开着十多个网页的chrome死掉了这种情况。。

在Linux下面，敲几个命令就OK了，以下每行都可以，有些区别

    ps -e | grep chorme | cut -c 1-5 | xargs kill -9
    ps -e | awk '$4=="chrome" {print $1}' | xargs kill -9

`ps -e`的输出如下

    12040 ?        00:00:00 kworker/1:1
    12041 ?        00:00:00 kworker/0:0
    12052 ?        00:00:09 chrome
    12119 ?        00:00:00 kworker/3:0

这个命令输出了当前的所有进程信息，最前面的就是进程的pid。第四列是进程的名称
    
`grep chrome`就是查找含有`chrome`的行并输出。`cut -c 1-5`意思是对输入的每一行取第1到5个字符(恰好是进程的pid)输出。两个命令合起来，就是输出进程名含有`chrome`的进程的pid。

`awk '$4=="chrome" {print $1}'`做了同样的事，不过这个命令输出的是进程名恰好是`chrome`的进程的pid，而不仅仅是包含。

`xargs kill -9`这个命令，输入以换行或者空白分割之后，作为参数执行一遍或者多遍后面跟随的命令

最后感叹一下，shell很强大！


