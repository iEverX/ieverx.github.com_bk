---
layout: post
title: "web.py中自定义jinja2模块"
tagline: "Custom Jinja2 Module In Web.Py"
description: ""
tags: [Python, jinja2, web开发, web.py]
---

web.py是一个轻量级的Python web开发框架，不过自带的模板自己很不习惯，就换成了jinja2。web.py已经封装了jinja2的接口，很简单

    from web.contrib.template import render_jinja
    render = render_jinja('templates', encoding='utf-8')

之后就和自带模板一样使用了。web.py中使用jinja2的源代码如下

    class render_jinja:
        """Rendering interface to Jinja2 Templates
        
        Example:

            render= render_jinja('templates')
            render.hello(name='jinja2')
        """
        def __init__(self, *a, **kwargs):
            extensions = kwargs.pop('extensions', [])
            globals = kwargs.pop('globals', {})

            from jinja2 import Environment,FileSystemLoader
            self._lookup = Environment(loader=FileSystemLoader(*a, **kwargs), extensions=extensions)
            self._lookup.globals.update(globals)
            
        def __getattr__(self, name):
            # Assuming all templates end with .html
            path = name + '.html'
            t = self._lookup.get_template(path)
            return t.render

在`__getattr__`函数中，`path = name + '.html'`使得只能访问同级目录下的模板。同时，还不方便使用自定义函数。在其基础之上，稍作修改即可，如下

    class RenderJinja2:

        postfix = ('.html', '', 'htm', 'tpl')

        def __init__(self, *a, **kwargs):
            extensions = kwargs.pop('extensions', [])
            globals = kwargs.pop('globals', {})
            registers = kwargs.pop('registers', {})

            self._lookup = Environment(loader=FileSystemLoader(*a, **kwargs), extensions=extensions)
            self._lookup.globals.update(globals)
            self._lookup.globals.update(registers)

        def render(self, path, **kwargs):
            for fix in self.postfix:
                realpath = path + fix
                try:
                    t = self._lookup.get_template(realpath)
                    return t.render(**kwargs)
                except:
                    pass
            raise TemplateNotFound

        def __getattr__(self, name):
            path = name + '.html'
            t = self._lookup.get_template(path)
            return t.render

现在，自定义的函数、变量可以通过register这个字典传入，渲染时也有两种方式，

    # 通过register传入自定义的函数或者变量，这里为了方便，使用了locals()
    render = RenderJinja2('path/to/templats', encoding='utf-8', registers=locals())
    
    # 渲染时
    render.render('path', **kwargs) # 新加的render
    render.post(**kwargs) # 原先的方式，通过 __getattr__


