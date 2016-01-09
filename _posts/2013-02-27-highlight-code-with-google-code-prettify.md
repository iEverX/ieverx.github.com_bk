---
layout: post
title: "Jekyll中使用google-code-prettify高亮代码"
tagline: "Highlight Code With Google-code-prettify In Jekyll"
description: "在Jekyll中高亮代码，利用google code pretty"
tags: [Jekyll, 代码高亮, google-code-prettify]
---

这个博客，到现在换了好几个代码高亮的工具，之前的SyntaxHIghlighter虽然漂亮，无奈加载太慢，只能舍弃了。现在用的这个是google-code-prettfy，效果也相当不错。最重要的是，非常小，加载速度比SyntaxHighlighter快得多，而且，可以直接使用markdown的语法去写代码。

首先需要两个文件，prettify.js和prettify.css，自己去官网去下。把这两个放到模板中，如下

    <link href="{{ ASSET_PATH }}/google-code-prettify/desert.css" rel="stylesheet" type="text/css" media="all">
    <script type="text/javascript" src="{{ ASSET_PATH }}/google-code-prettify/prettify.js"></script>

考虑到加载速度，最好js写到文档末尾，body闭合标签之前，css写到头部

之后，还需要加上如下代码，用于识别并高亮代码块，这个需要使用jQuery

    $(function() {
      window.prettyPrint && prettyPrint();
    });
      

现在，就可以使用`<pre></pre>`标签进行高亮了，

    <pre class="prettyPrint">
    // code here
    </pre>

但这样会有些问题，就是在书写html代码的时候，html标签会被浏览器认为是标签而不是代码的字符。而markdown的语法写的代码其实已经解决了这个问题，所以，我们可以利用如下的js代码，来避免自己用`<pre></pre>`写代码所出现的问题，同样需要jQuery支持

    $(function() {
      $('pre').addClass('prettyprint linenums').attr('style', 'overflow:auto');
    });

这样之后，就没有问题了，可以直接用markdown的前置4空格来写代码了。其中`addClass('prettyprint linenums')`的`linenums`是添加行号的意思。默认只显示第5、10、15...行，可以在css文件中li的格式添加`list-style-type: decimal;`，以显示全部行号

另外，如果博客中有用bootstrap，其中对`pre`有如下几句

    white-space:pre;white-space:pre-wrap;word-break:break-all;word-wrap:break-word;

这会使得pre中的代码自动换行，而不是溢出形成滚动条。如果不希望如此，可以注释掉。就看个人的喜好了。如果是滚动条，默认的滚动太难看，可以修改一下样式，看一下[这篇文章][scroll]

[scroll]: http://www.javascript100.com/?p=756




