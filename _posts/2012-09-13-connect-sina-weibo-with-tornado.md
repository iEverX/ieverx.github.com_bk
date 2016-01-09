---
layout: post
title: "用Tornado连接新浪微博"
tagline: "Connect Sina Weibo With Tornado"
description: "利用Tornado框架连接新浪微博，发送邮件"
tags: ["Python", "web开发", "Tornado", "新浪微博"]
---

前几天心血来潮，稍稍看了一下Tornado框架，感觉这个框架和web.py很像（因为本来Tornado就是在web.py的基础上修改而来的）。

微博的API就是微博官网上的那个新的API，可以从[这里][]下载。网上有很多的教程，不过用的都是原来的API，不过也可以参照。不多说了，直接贴代码，不过这是简写的，不过可以连接到微博了。

    #! /usr/bin/env python
    # -*- coding: utf-8 -*-

    import tornado.web
    import tornado.ioloop

    from weibo import APIClient

    APP_KEY = '*****'
    APP_SECRET = '******'
    CALLBACK_URL = 'http://apps.weibo.com/webotxyz/callback'
    # 这是回调地址，必须在微博应用的域名下面，否则报错

    class Index(tornado.web.RequestHandler):
        def post(self): # 注意，这里是post
            client = APIClient(app_key=APP_KEY, 
                               app_secret=APP_SECRET,
                               redirect_uri=CALLBACK_URL)
            url = client.get_authorize_url()
            # self.write('<a href="' + url +'">click</a>') 
            # 用户点击链接后跳转到验证界面
            self.redirect(url) # 直接跳转到验证界面

    class Callback(tornado.web.RequestHandler):
        def post(self): # 注意，这里也是post
            code = self.get_argument('code')
            client = APIClient(app_key=APP_KEY,
                               app_secret=APP_SECRET,
                               redirect_uri=CALLBACK_URL)
            r = client.request_access_token(code)
            access_token = r.access_token
            expires_in = r.expires_in
            client.set_access_token(access_token, expires_in)
            # res = client.get.statuses__user_timeline(screen_name='iEverX')
            # 这以后就可以自己调用API了，比如上一句就是抓取我的最近的微博

    app = tornado.web.Application([
        (r'/', Index),
        ('/callback', Callback),
    ])

    if __name__ == '__main__':
        app.listen(9009)
        tornado.ioloop.IOLoop.instance().start()


我的应用的源码在这里<http://github.com/iEverX/webotxyz>，不过我的应用不可能上线的了，因为抓取数据存到邮箱了。。

下面是我在里面用到的一段Python发送邮件的代码，比较短，可以充分的看出Python的简洁

    #! /usr/bin/env python
    # -*- coding: utf-8 -*-

    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    def send_mail(mail_from, mail_to_list, subject, content):
        from_format = 'Ever' + '<' + mail_from + '>'
        # 格式应该是这样的 Nickname<username@host.address>，中间无空格
        txt = MIMEText(content, 'html') # 若content中有html编码
        # txt = MIMEText(content) # 若content中没有html编码
        txt.set_charset('utf-8')
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['From'] = from_mail
        msg['To'] = ';'.join(mail_to_list)
        msg.attach(txt)
        try:
            s = smtplib.SMTP()
            s.connect(mail_info['host'])
            s.login(mail_info['sender'], mail_info['sender_password'])
            s.sendmail(mail_info['sender_address'], mail_to_list, msg.as_string())
            s.close()
        except:
            return false
        return True


嗯，这篇文章几乎都是代码，就当是自己的备忘录好了。。

[这里]: http://michaelliao.github.com/sinaweibopy/
