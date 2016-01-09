---
layout: post
title: "在Jekyll中用SyntaxHighlighter高亮代码"
tagline: "Use SyntaxHighlighter Highlighting Code In Jekyll"
description: "在Jekyll中利用SyntaxHighlighter对文章中的代码快进行高亮"
tags: ["Jekyll", "SyntaxHighlighter", 代码高亮]
---

前几天把博客里的代码高亮改成[SyntaxHighligher][]了，感觉好了很多，看着也舒服，关键是复制代码的时候，行号连着代码在一行复制了。主要参考了官网给的这个链接[Adding a Syntax Highlighter to your Blogger blog][Blogger]。Jekyll的灵活性应该比Blogger更大，而且直接贴改代码，所以对于Jekyll这个方法是合适的。下面是具体的过程

在Jekyll的模板页里的head里面，添加如下代码，选自己需要的语言的刷子就好

    <link href='/static/css/syntaxhighlighter/shCore.css' rel='stylesheet' type='text/css'/>
    <link href='/static/css/syntaxhighlighter/shThemeDefault.css' rel='stylesheet' type='text/css'/>
    <script src='/static/js/syntaxhighlighter/shCore.js' type='text/javascript'></script>
    <!-- The Following is styles for different language  -->
    <script src='/static/js/syntaxhighlighter/shBrushBash.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushCpp.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushCSharp.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushCss.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushJava.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushJScript.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushPhp.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushPython.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushRuby.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushSql.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushVb.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushXml.js' type='text/javascript'></script>
    <script src='/static/js/syntaxhighlighter/shBrushPerl.js' type='text/javascript'></script>
    <script language='javascript'>
      SyntaxHighlighter.all();
    </script>

其中，src里面是文件的目录，把从官网上下载的对应的js文件和css文件放到对应的目录即可。其实也可以直接引用官网的js文件，比如这样（以下代码来自我参考的网址，去掉了一些不需要的代码）

    <link href='http://alexgorbatchev.com/pub/sh/current/styles/shCore.css' rel='stylesheet' type='text/css'/>
    <link href='http://alexgorbatchev.com/pub/sh/current/styles/shThemeDefault.css' rel='stylesheet' type='text/css'/>
    <script src='http://alexgorbatchev.com/pub/sh/current/scripts/shCore.js' type='text/javascript'></script>
    <script src='http://alexgorbatchev.com/pub/sh/current/scripts/shBrushCpp.js' type='text/javascript'></script>
    <script language='javascript'>
        SyntaxHighlighter.all();
    </script>

不过，这样会导致没有联网的时候，自己写博客预览的时候看不到代码的高亮效果。

之后，写代码的时候，不要使用markdown的语法，直接用pre抱起来就好了。就比如这样

    <pre class="brush: cpp">
    </pre>


效果就和以上一样了。这个应该比pygments更好看吧。不过目前加载速度比较慢，以后再改吧


[SyntaxHighlighter]: http://alexgorbatchev.com/SyntaxHighlighter/
[Blogger]: http://www.cyberack.com/2007/07/adding-syntax-highlighter-to-blogger.html
