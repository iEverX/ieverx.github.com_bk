---
layout: post
title: "React和Redux初探"
tagline: "First Glance Of React And Redux"
description: ""
tags: [前端, React, Redux]
---
{% include JB/setup %}

React是Facebook开发的一套前端框架，与Angular等前端MVC框架不一样的是，React关注于构建UI，其相当于MVC中的V。而React最让人欣喜的一点在于，其使用了声明的方式开发UI，这使得基于组件（Component）的前端开发变得非常直接。然而仅仅使用React，还远远不能构建一个App，还需要有数据存储和逻辑处理，这当然可以使用MVC架构。不过，Facebook认为，MVC架构中，当Model和View增多以后，双向的数据流导致系统的复杂性增加。因而Facebook提出了一个Flux。可以认为Flux是一套应用框架，与MVC不同的是，其数据流是单向的，结构如下图所示 ![static/content/images/flux-simple-f8-diagram-explained-1300w.png]()
由于数据的单向流动，无须处理`view->model`的逻辑，因此系统的结构比较清晰。

## React
对于如下的html代码，
```html
<div class="post">
    <h1 style="font-size: 1.6rem">Post Title</h1>
    <div class="post-content">Some Content</div>
</div>
```
我们可以使用这样的React代码来构建
```javascript
// app.js
var Post = React.createClass({
    render: function() {
        return (
            <div className="post">
                <PostTitle text='Post Title'/>
                <PostContent text='Some Content'/>
            </div>
        )
    }
});
var PostTitle = React.createClass({
    render: function() {
        var style = {fontSize: '1.6rem'};
        return <h1 style={style}>{this.props.text}</h1>
    }
});
var PostContent = React.createClass({
    render: function() {
        return <div className='post-content'>{this.props.text}</div>
    }
});
React.render(
    <Post />,
    document.getElementById('root');
);
```
对应的html文件，则是
```html
<div id="root"></div>
<script type="text/jsx" src="app.js"></script>
```
可以看到，React将原本的html代码拆成了三个组件，其中`Post`由`PostTitle`和`PostContent`两个组件构成。最后再通过`React.render`方法，将组件挂载到dom上。
