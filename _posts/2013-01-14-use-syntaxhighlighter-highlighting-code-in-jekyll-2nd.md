---
layout: post
title: "在Jekyll中用SyntaxHighlighter高亮代码2"
tagline: "Use SyntaxHighlighter Highlighting Code In Jekyll 2nd"
description: "在Jekyll中利用SyntaxHighlighter对文章中的代码快进行高亮"
tags: ["Jekyll", "SyntaxHighlighter", 代码高亮]
---

之前有一篇博客是关于在Jekyll中利用SyntaxHighlighter去高亮代码的。不过那篇博客中的方法需要每次都加载所有的js文件，加载速度比较慢。其实，可以利用js动态加载js来实现对于不同的语言加载不同的语法分析文件，从而提高js文件的加载速度。废话不多说了，上代码

    <script language='javascript'>
        $(function () {

            var stdname = {
                'bash': 'Bash',
                'sh': 'Bash',
                'c': 'Cpp',
                'cpp': 'Cpp',
                'cs': 'CSharp',
                'css': 'Css',
                'java': 'Java',
                'js': 'JScript',
                'php': 'Php',
                'py': 'Python',
                'python': 'Python',
                'rb': 'Ruby',
                'sql': 'Sql',
                'vb': 'Vb',
                'xml': 'Xml',
                'html': 'Xml',
                'perl': 'Perl'
            };

            var used = {};

            var $t = $('pre[class^=brush]');
            if ($t.length > 0) {
                $('body').append('<script src="/static/js/syntaxhighlighter/shCore.js" type="text/javascript"></script>');
            }
            $t.each(function() {
                var lang = stdname[$.trim($(this).attr('class').substring(6))];
                if (used[lang]) {
                    return;
                }
                used[lang] = true;
                $('body').append('<script type="text/javascript" src="/static/js/syntaxhighlighter/shBrush' + lang + '.js"></script>');
            });
            if ($t.length > 0) {
                $('body').append('<script language="javascript">SyntaxHighlighter.all();</script>');
            }
        });
    </script>

把以上这段代码放在Jekyll模板页的body的最后面即可。

这段代码需要jQuery，我的是1.8.2，不知道低版本的是否可以。此外，shCore.css，shThemeDefault.css文件不是动态加载，所以，这两个文件仍然需要直接放在模板页的头部。

