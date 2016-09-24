---
layout: post
title: 用Rust写了一个简单的Web服务器
tags: [Rust, Web服务器]
---

## Rust

最近学了一阵Rust，这个语言的目的是系统编程，卖点是无GC的内存安全。为了实现这一点，Rust引入了所有权、借用、生命周期的概念。可以在编译器检查出可能的内存问题，如野指针、局部变量指针等等。不过这也对写程序造成了一定的困扰，对于move、borrow等如果理解的不是很到位，那必然要和编译器做长期的斗争。

## Web服务器

### 骨架

Web服务器，实际上就是对socket的数据流的处理，监听端口，并对每个新的连接，开启一个新的线程进行处理。代码的骨架基本上是

```rust
match TcpListener::bind("127.0.0.1", 9999)) {
    Ok(listener) => {
        for stream in listener.incoming() {
            match stream {
                Err(e) => {
                    // error, log, ignore
                },
                Ok(s) => {
                    thread::spawn(move || handle_client(s));
                },
            }
        }
        drop(listener);
    },
    Err(e) => {
        // error, log, ignore
    }
}
```
其中`thread::spawn(move || handle_client(s))`，开启新的线程，参数是一个闭包，`move`关键字表示将闭包所在环境的标量的所有权强行交给闭包。之后重点是`handle_client`中对于`TcpStream`的处理，也就是解析请求，并构造响应。读取请求。


### 解析请求

一个HTTP的请求，格式是这样的

````
METHOD URI VERSION
Host: xxx
other-header: xxx

body
````
这个服务器目前只能处理GET和HEAD请求，并且只能处理静态文件，所有很多东西并没有做。比如querystring的解析、请求体的解析等等。各种header也只是解析，并没有真的使用。之后会慢慢完善，函数重点是

```rust
fn parse(stream: &mut TcpStream) -> Option<Request> {
    let mut s = Vec::new();
    Self::get_request(stream, &mut s);
    match String::from_utf8(s) {
        Ok(s) => {
            // parse request line and header
        },
        Err(_) => None,
    }
}
```

如果解析失败，返回一个`None`，这是`Request`结构的一个静态方法。解析成功则打印日志，并根据请求构造响应。

### 构造响应

响应的的格式为

````
VERSION CODE PHRASE
header: xxx
other-header: xxx

body
````

由于只能处理静态请求，实际上这里就是读取文件并.对于`HEAD`请求，只计算长度，没有响应体部分。

目前的相应的结构为

```rust
struct Response {
    head: String,
    body: String
}
```

通过code、mime、content等拼接字符串，得到响应头部以及响应体。最后通过`TcpStream`发送出去。

至此，这个web服务器就算是完成了。

## 最后

Rust这个语言还是非常不熟，对于lifetime的理解也太行，所以通篇没有用到lifetime标记，遇到字符串都是用的String。另外，Rust目前并没有高性能的非阻塞IO以及异步IO，有一些库在做这方面的尝试。不过对这方面不熟，没有多做尝试。

最后，项目的地址是<https://github.com/iEverX/rock>