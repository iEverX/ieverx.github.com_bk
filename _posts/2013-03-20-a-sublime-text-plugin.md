---
layout: post
title: "自己写sublime text插件"
tagline: "A Sublime Text Plugin"
description: ""
tags: ["Sublime Text", "Sublime Text 2", "插件"]
---

起因是，自己写Python基本上使用sublime text 2。但是，文件头部的代码

    #! /usr/bin/env python
    # -*- coding: utf-8 -*-

如果每次都要敲的话，很麻烦。而如果不敲的化，一旦涉及中文，又会报错，就产生了写了一个插件的想法。。问题好久了，直到今天才动手，惭愧一下。。

思路应该是比较简单，就是判断文件类型，然后在头部插入特定的字符串。于是乎，开始在网上查找sumblime text 2的API还有插件开发教程。这是[API文档][]，[中文翻译版][]，看一下Default里面的自带插件，就可以动手了。

最初的代码中，字符串是硬编码的。后来，则是从模板文件中读取字符串。在这一步，遇到了一个很诡异的问题，是这样的：模板文件保存在templates文件夹下面，在HeadTemplate.py中（我的插件的名字是HeadTemplate），

    def get_tpl_file(settings, filename):
        template_root = settings.get('template_root')
        path = os.path.join(os.path.dirname(__file__), template_root)
        return os.path.join(path, filename)

但是这个函数的返回的结果是`/home/username/templates/filename`，而实际上，我认为应该返回的是`/home/username/.config/sublime-text-2/Packages/HeadTemplate/templates/filename`。打印`os.path.abspath(__file__)`，得到的结果是`/home/username`也就是我的家目录。开始以为是由于隐藏文件夹的缘故，不过试验之后，发现与之无关。为什么会有这个结果，具体原因到现在我也还弄不清楚。不过，解决方案倒是找到了，感谢SErHo的[代码][]

    PACKAGE_NAME = 'HeadTemplate'
    PACKAGES_PATH = sublime.packages_path()

    def get_tpl_file(settings, filename):
        template_root = os.path.join(
                        PACKAGES_PATH, 
                        PACKAGE_NAME, 
                        settings.get('template_root'))
        return os.path.join(template_root, filename)

在其他就没有什么了，按部就班的写下来就好了。代码放在了github上，<https://github.com/iEverX/HeadTemplate>

算上空行不到50，却写了一个下午。。

[API文档]: http://www.sublimetext.com/docs/2/api_reference.html 
[中文翻译版]: http://ux.etao.com/posts/549
[代码]: https://github.com/SerhoLiu/SublimeNFFT
