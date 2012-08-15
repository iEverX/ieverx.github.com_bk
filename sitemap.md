---
# Remember to set production_url in your _config.yml file!
layout: page
title : Sitemap
---
{% include JB/setup %}

{% for page in site.pages %}
<a href={{site.production_url}}{{ page.url}}>
{{site.production_url}}{{ page.url }}</a></p>{% endfor %}

{% for post in site.posts %}
<a href={{site.production_url}}{{ post.url }}>
{{site.production_url}}{{ post.url }}</a></p>{% endfor %}
