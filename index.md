---
layout: page
title: 天外天
tagline: 分享编程的点滴
---
{% include JB/setup %}

<ul class="posts">
{% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">
        {{post.title }}</a></li>
{% endfor %}
</ul>
