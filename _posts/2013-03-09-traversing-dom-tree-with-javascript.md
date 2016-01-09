---
layout: post
title: "Javascript遍历DOM树"
tagline: "Traversing DOM Tree With Javascript"
description: "截取文章头部作为首页的预览内容，利用Javascript遍历DOM树来实现。顺道吐槽Liquid"
tags: [Javascript, jQuery, DOM, Jekyll, Liquid]
---

这个博客是利用Jekyll在github pages上搭建的，显示在首页的文章，如果用`{% raw %}{{ post.content | truncate: 200 }}{% endraw %}`，原有的格式不能完全保持，且有时在最后会有乱码。而`{% raw %}{{ post.content | truncatewords: 50 }}{% endraw %}`也有不能保持格式的问题，而且对于中文来说，word的概念大概就变成了句子，截取的长度不能确定。本来[truncatehtml][]这个插件可以解决格式保持的问题，但是出于安全的考虑，github pages不允许运行插件，所以。。。

这个问题有很长时间了，今天闲的没事，用js写了一下。就是遍历DOM树，叠加文本节点的长度，当长度达到既定长度时，其后所有的节点修改style为`display: none`，用jQuery就是`hide()`，具体到自己的博客，代码如下，

    $(function() {
        function traverse($node, len, maxCount) {
          var reachMaxCount = len > maxCount;
          if (reachMaxCount) {
            $node.hide();
          }
          var $contents = $node.contents();
          for (var i = 0; i < $contents.length; ++i) {
            if (reachMaxCount) {
              $contents.eq(i).hide();
              continue;
            }
            if ($contents[i].nodeType == 3) { // TextNode
              var tmp = len;
              var s = $contents[i].nodeValue;
              len += s.length;
              reachMaxCount = len > maxCount;
              if (reachMaxCount) {
                $contents[i].nodeValue = s.substring(0, maxCount - tmp);
              }
            }
            else if ($contents[i].nodeType == 1) { // Element
              len = traverse($contents.eq(i), len, maxCount);
            }
          }
          return len;
        }

        $('.post_at_index').each(function() {
          traverse($(this), 0, {{ site.description_length }});
          var thisUrl = $(this).siblings().first().children().attr('href');
          $(this).after('\n<a href="' + thisUrl + '" rel="nofollow">' + 'Read More ...</a>');
        });
    });
    

对于js，我都会使用jQuery，这个同样如此，需要jQuery的支持。在最后加上了了read more，指向页面。写完之后，发现代码不长，不过却花了我一个下午的时间，主要是对js太不熟悉了，上网各种查，开始是用的`children()`这个方法，但是这个不能处理很好，后来改成了`contents()`，不过已经浪费了很长时间了。。

另外吐槽一下Liquid这个模板，规避标签太麻烦了，比如要打一个

    {% raw %}{{ some tag }}{% endraw %}
    {% raw %}{% some tag %}{% endraw %}

需要如下这样才行，

    {{'{'}}% raw %}{% raw %}{{ some tag }}{% endraw %}{{'{'}}% endraw %}
    {{'{'}}% raw %}{% raw %}{% some tag %}{% endraw %}{{'{'}}% endraw %}
    或者
    {% raw %}{{'{'}}{ some tag }}{% endraw %}
    {% raw %}{{'{'}}% some tag %}{% endraw %}

其他的模板带语言，要输出自身的控制标签确实都不容易，但是Liquid已经不是不容易，而是复杂了。。我感觉，如果有两个停止解析的标志，比如说

    {! here is not parsed !}
    {@ here is not parsed @}

那么，如果有如果有显示`{! !}`，只需要`{@ {! !} @}`，目前，Liquid有标签`raw`和`literal`可以使用，但是我的试验结果是`literal`和`raw`似乎不太协调，不知什么原因，渲染结果总是与预想的结果不一致。。看了Liquid的issue，发现有可能是Jekyll的问题，也不清楚到底是怎么回事，不去想了。。

    


[truncatehtml]: https://github.com/MattHall/truncatehtml
