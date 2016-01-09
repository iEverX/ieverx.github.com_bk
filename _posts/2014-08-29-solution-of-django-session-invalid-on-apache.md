---
layout: post
title: "Django Session在Apache服务器失效的问题的解决记录"
tagline: "Solution Of Django Session Invalid On Apache"
description: ""
tags: [Django, Apache, SVN]
---

实验室项目，用Django写的Web端，需要登陆功能，因为Django自带的登陆比较庞大，自己写了一个了，没有权限等一些列东西，比较easy的，其中，require_signin这个装饰器是这样的

    def require_signin(f):
    @wraps(f)
    def deco(request, *args, **kwargs):
        if 'user' in request.session:
            return f(request, *args, **kwargs)
        url = '%s?next=%s' % (LOGIN_URL, request.path)
        return redirect(url)
    return deco

在本地开发的时候，没有任何问题。但是上传到服务器的时候，其中的`'user' in request.session`总是返回`False`，打印了`session.keys()`来看，确实是空的。以为是数据库访问的问题（session的后端是数据库），将本地和服务器的配置文件分开了，结果仍然如此，至此陷入困境。在网上搜索，偶然发现apache的`MaxRequestsPerChild`设置选项可能和其相关，因为之前为了使提交到SVN的代码能够立刻生效，将这个值设置为了1，这导致了每次请求重开进程，而session在进程之间应该不能保存的（不知道是不是有办法设置为可以保存），将这个值改大就会正常了。

之后就有了一个新问题，提交到SVN之后，改动不会在服务器立即显示出来，需要手动重启服务器，这就很不方便。可以利用SVN的post-commit hook来重启服务器。SVN的hooks是在提交的时候，执行一些特定的操作，post-commit hook就是在提交之后，执行操作，windows下，可以使用批处理文件，其他语言如Python等也可以，但是现在这个是一个easy的任务，不必祭出Python，


	/path/to/apache/bin/httpd.exe -k restart

这一句就足够了。利用hooks，可以实现很多功能，如果程序的部署，要求输入“提交信息”等，很强大的工具。git当然也有