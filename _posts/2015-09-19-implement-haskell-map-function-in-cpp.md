---
layout: post
title: "在C++中实现Haskell的map函数"
tagline: "Implement Haskell Map Function In Cpp"
description: ""
tags: [Haskell, C++]
lang: hs
---

C++11中引入了lambda，类似如下的语法

```cpp
[value](int x) -> int { return x * x; }
```

其中，`[]`中的部分，是捕获外界变量，`()`中的部分则是参数，`->`表明返回类型，`{}`中是函数体。

正好这几天在看Haskell，于是想要在C++中实现Haskell中的`map`函数。Haskell中，`map`的的效果与下面的代码效果相同，

```haskell
map :: (a -> b) -> [a] -> [b]
map _ [] = []
map f (x:xs) = f x: map f xs
```

实际上是一个列表中的所有元素都用给定的函数进行计算，其结果保存为一个新的列表。

我期望最终的`map`函数，可以进行这样的调用

```cpp
// lambda，多态
vector<int> ir = map([](int x) { return x * x; }, int_vec);
vector<bool> br map([](double n) { return n > 0; }, double_vec);

// 函数指针
int f(string s) { return s.length() }
vector<int> ir2 = map(f, string_vec);

// functor
struct F {
	int operator()(int n) {
		return n % 5;
	}
}
vector<int> ir3 = map(F(), int_vec);
```

我第一次想到的函数声明是这个样子的

```cpp
template<typename T, typename R>
vector<R> map(R f(T), vector<T> list);
```

这个声明的问题在于，`R f(T)`是个函数指针，不接受lambda函数和functor，让人很无奈。于是尝试将类型改为function<R(T)>，也就是下面这样（之后省略template说明）

```cpp
vector<R> map(function<R(T)> f, vector<T> list);
```

现在3中方式都可以了，但是问题是，需要强制类型转换。这就比较痛苦了。至此陷入了困境。然后我想C++标准库库中是有可以传入lambda的函数的。于是我打开了`algorithm`，里面有个`for_each`函数，其声明是这样的

```cpp
template<class _InIt,
	class _Fn1> inline
	_Fn1 for_each(_InIt _First, _InIt _Last, _Fn1 _Func)
```

也就是将函数类型作为多模板参数，于是我也将我的声明修改了一下

```cpp
vector<R> map(F f, vector<T> list);
```

然后又报错了，C++编译器无法推断出R的类型。

其实从Haskell的`map`的类型可以看出来，我们并不需要3个模板参数，输入类型T，输出类型R，函数类型F，是有关系的，`F(T) = R`，最开始，我是使用T和R来表示F，并不是很成功。从它们的关系来看，使用F和T表示R，相比之下，要比用F，R表示T来的直白的多。现在的问题是，如何使用C++的语法来表示R。

C++11中有个`decltype`，可以用来表示一个类型。如下

```cpp
// 声明一个x类型的y
decltype(x) y = x;
// 与下面一行功能相同
auto y = x;

// 表明函数的返回类型
auto f(int t) -> decltype(foo(t));
```

最后一行，则使用了`decltype`来指明函数的返回类型和`foot(t)`的类型一样。那么，我们就可以写出`map`的函数声明了

```cpp
auto f_map(F f, vector<T> list) -> vector<decltype(f(T()))>
```

其中`decltype(f(T()))`，`T()`是T类型的无参构造函数。当然也可以是用`*begin(list)`或者`*list.end()`等等，`decltype`与`sizeof`类似，不会对操作数进行求值。

最终的完整函数是这这样的

```cpp
template <typename T, typename F>
auto f_map(F f, vector<T> list) -> vector<decltype (f(T()))> {
	vector<decltype(f(T()))> result;
	for (auto it = begin(list); it != end(list); ++it) {
		result.push_back(f(*it));
	}
	return result;
}
```

现在的实现的是map，当时我还想实现更加一般化的`fmap`

```hs
class Functor f where
	fmap :: (a -> b) -> f a -> f b
```

`fmap`并没有一个统一的实现，对于列表而言，`fmap`的实现就是`fmap = map`。注意，这里`Functor`和C++中的`Functor`不是一个概念。

当然Haskell中的`Functor`在C++中不存在，我只是想写一个这种模式，比如对于一些容器，如`set`，`map`等等，可以进行`map`操作（实际上，这些容器，可以被定义为Haskell中的`Functor`）。但最后我放弃了，因为在C++中，这些容器并不具体有共同的基类，我可以写出函数声明，但是实现却无法统一。

```cpp
template <template <typename...> class C, typename F, typename T>
auto mymap (F f, C<T> list) -> C<decltype(f(T()))>;
```

其实标准库中已经有了类似的函数，就是`transform`，不过`transform`并不返回值，而是通过一个指针，修改外部的变量

```cpp
vector<int> result;
transform(begin(input), end(input), back_inserter(result),
		[](int x) { return x + 3; });
```

`result`就是map后返回的结果。

总体来说，由于C++和Haskell的设计理念并不相同，Haskell中的`fmap`无法（至少我无法）完全在C++中实现，而`map`由于限制较少，其实现没有问题。此外，C++的标准库中其实提供的了许多与Haskell中功能的相似的函数，但是名字并不相同，而且细节略有差异。C++的容器操作，一般是需要提供指明起止位置的iterator，对一个范围进行操作。而Haskell由于值不可修改，因此均是对所有元素进行操作的，最后返回新值。
