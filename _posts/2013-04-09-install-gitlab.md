---
layout: post
title: "安装GitLab"
tagline: "Install Gitlab"
description: "在Linux下安装GitLab"
tags: [git, GitLab, Linux]
---

在V2EX上面看了一个如何管理自己的代码的帖子，里面有个回答是使用gitlab，于是搜了一下。。可以这么说，gitlab是开源的github，可以在自己的电脑上搭一个私人的git托管服务，相当不错。对于自己来说，其实就是折腾啦，可以不用把所有的代码都扔到github上面，但是有个不好就是在自己的机器上面，一旦系统挂了，代码就没了。。

安装就是跟着官方的[安装文档][]，一路下来就可以了，由于网络速度以及各种其他问题，我装了两天。需要提醒的一点是，文档里面，安装路径是`/home/git/gitlab`，建议不要修改，因为有些地方是硬编码了这个路径的，如果修改可能会导致网站不能跑起来。

在安装过程中的需要`bundle install`的地方，由于众所周知的原因，建议把Gemfile中的地址修改为`http://ruby.taobao.org`，加快速度。

在安装过程中，我遇到的一些问题:

* 在Gemfile中有些这样的写法`require: :xxx`，如果`bundle install`出现问题，可以把这种写法改成`:require => xxx`。这个原因是ruby 的版本太老不支持新的语法（但是我的ruby是最新的也报错了。。）
* 在执行`bundle install`时，提示需要 ruby的版本大于1.9.2，而实际上我的机器上ruby是1.9.3，这时执行`sudo apt-get install gem`之后重新执行改命令
* 安装数据库时，未修改配置文件，导致登录数据库错误。这个只要修改了配置文件即可，注意应该修改`production`中的配置

安装完成后，有个管理员账户

    email:    admin@local.host
    password: 5iveL!fe
    
如果要增加用户，只能通过管理员账户新建用户，不能自由注册，毕竟gitlab是私人的托管服务，面向的是小型的团队。

装完之后用了一下，虽然和github很像，功能也比较齐全，和github还是有所不同。建立一个新的项目的时候，不会自动建立新的repo而是需要自己手动建立并push。。当然还有其他区别，在此不一一列举了

[安装文档]: https://github.com/gitlabhq/gitlabhq/blob/5-0-stable/doc/install/installation.md


