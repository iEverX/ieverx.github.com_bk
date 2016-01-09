---
layout: post
title: "React和Redux初探"
tagline: "First Glance Of React And Redux"
description: ""
tags: [前端, React, Redux]
---

React是Facebook开发的一套前端框架，与Angular等前端MVC框架不一样的是，React关注于构建UI，其相当于MVC中的V。而React最让人欣喜的一点在于，其使用了声明的方式开发UI，这使得基于组件（Component）的前端开发变得非常直接。然而仅仅使用React，还远远不能构建一个App，还需要有数据存储和逻辑处理，这当然可以使用MVC架构。不过，Facebook认为，MVC架构中，当Model和View增多以后，双向的数据流导致系统的复杂性增加。因而Facebook提出了一个Flux。可以认为Flux是一套应用框架，与MVC不同的是，其数据流是单向的，结构如下图所示 ![](/static/content/images/flux-simple-f8-diagram-explained-1300w.png)
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

```js
// app.js
var Post = React.createClass({
    render: function() {
        return (
            <div className='post'>
                <PostTitle text='Post Title' />
                <PostContent text='Some Content' />
            </div>
        );
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
上面的`app.js`文件并不是Javascript纯粹代码，而是夹杂了一些类似HTML的代码。这是JSX代码，并不能被浏览器执行，因此需要预先编译成js代码。

从代码中，可以看到，React将原本的html代码拆成了三个组件，其中`Post`由`PostTitle`和`PostContent`两个组件构成。最后再通过`React.render`方法，将组件挂载到dom上。每个组件中，都有一个`render`方法，表示组件将要渲染的dom结构。与HTML相比，只是可以使用`{}`将参数传入到组件中，而组件则可以通过`props`获取属性。这种结构，称之为Virtual Dom，在返回的结果中，`div`, `h1`等和自己定义的`Post`，`PostTitle`等类似，都是Virtual Dom，只不过`div`这种HTML本身已有的组件，其渲染结果就是与其对应的HTML标签。React约定，自己定义的组件使用大写字母开头，已有HTML标签为小写字母开头。并非所有HTML标签和属性都被React支持，可以在在[这里][react-tags]查看支持的标签和属性。其中，`class`和`for`分别使用`className`和`htmlFor`，因为这两个都是js的关键字。

## Redux
由于Flux还是属于新生事物，各种Flux实现多如牛毛，比如Reflux、Fluxxor等等，Redux也是其中的一种。Redux借鉴了函数式的编程思想，对于状态的改变，其实是如下的函数

````
f(state, action) => next_state
````
这种函数在Redux里称为Reducer, 而Flux中的Store则是多个由Reducer组成。这样，对于一个Action以及当前的状态，可以转移到下一个状态，从而更新View。

我根据其github的breaking-changes-1.0分支([地址][redux-repo])的例子，大致明白了现在的API，但是仍有非常多的东西不是很清楚，需要等到正式版放出之后，查看文档才能明白了。

至于Redux相比其他Flux实现有什么优点，其实我说不上来，最初吸引我的其实不是Redux，而是[这篇文章][react-europe]，当时也根本不了解Flux（现在其实也不了解。。），就稀里糊涂的看了Redux的例子。

## 前端
感觉目前的前端越来越复杂，Javascript的应用也越来越多。甚至都有了以后找个前端工作的念头，谁知道呢。。

[react-tags]: https://facebook.github.io/react/docs/tags-and-attributes.html
[redux-repo]: https://github.com/gaearon/redux/tree/breaking-changes-1.0
[react-europe]: http://react-china.org/t/reacteurope-conf/1662