---
layout: post
title: Haskell Parsec的简短介绍[译]
tags: [Haskell, Parsec, 翻译]
lang: hs
---

本文翻译自<http://unbui.lt/#!/post/haskell-parsec-basics/>。这是我第一次翻译文章，这篇文章的英文看起来也不是很难，只是想尝试翻一下。由于第一次，许多地方的翻译并没有很通顺，整片文章读起来也是有些奇怪。此外代码中的注释没有翻译。以下是正文。

> Parsec的存在使得在Haskell中解析文本非常简单。这篇文章的目的在于给我自己和其他人一个从零开始介绍每个函数，并配有例子的指南和参考。

首先，为什么要用Parsec而不是与之类似于正则表达式之类的东西来解析内容呢？其他语言中，把内容切分成数组，每次用正则表达式处理一部分，这种方式或者类似的其他方式，是一种非常常见的模式。在Haskell中，我们也可以采用这种方式，但是我已经看到了Parsec发出的光，我想把这种更好的方式介绍给你们。

大多数的指南都是上来就是一个完整的例子，但是我会一个一个的介绍这些不同的函数，以后这篇文章也可以作为一个使用Parsec的备忘（对我自己和所有其他人都是如此）。我尽量保证每个例子是独立的，所以跳过某些部分并不会有问题，但是请注意最开始的基础代码。我也把所有的例子的代码放到了[这个文件][]中，可以直接使用`:load`命令读到`ghci`中使用。

## 基础

对于一个从头到尾的文本流，Parsec会尝试用一个规则或者规则的集合去匹配这个输入流。Parsec也是一个monadic，所以我们可以很容易把不同的规则通过`do`拼凑到一个序列中。一个一般的概念是，一个规则的工作方式是，每次从输入消费一个字符，并判断是否匹配。所以当把几个规则拼凑正一个序列时，每个规则会消费部分输入，直到没有输入、没有规则或者某个规则没有匹配（产生一个error）。

我们首先从最基本的开始。我qualified引入了`Parsec`，所以可以直接使用`Parsec`函数（注：无需使用包名前缀）。同时引入了`Control.Applicative`，因此稍后可以使用applicative形式的代码。最后给`parseTest`起了一个简短的别名。

```haskell
-- I import qualified so that it's clear which
-- functions are from the parsec library:
import qualified Text.Parsec as Parsec

-- I am the error message infix operator, used later:
import Text.Parsec ((<?>))

-- Imported so we can play with applicative things later.
-- not qualified as mostly infix operators we'll be using.
import Control.Applicative

-- Get the Identity monad from here:
import Control.Monad.Identity (Identity)

-- alias Parsec.parse for more concise usage in my examples:
parse rule text = Parsec.parse rule "(source)" text
```

以上就是基本的设定，并定义了一个简单的函数`parse`，这个函数只是忽略了`Parsec.parse`的第二个参数（实际上，这个参数是带解析内容的文件名，只用于Parsec显示错误信息是能提供一些其他的信息）。

Parsec是有一系列的“积木”搭建起来的，每一块都是一个规则本身，或者是与其他规则一起组成的更复杂的规则。接下来我们看看这些基础的积木，以及它们是如何和上面的基本设定一起工作的。

### `Parsec.char`

这个函数返回一个规则，该规则根据输入的参数，去匹配输入文本中的当前字符。我们ghci中运行一下。

```haskell
ghci> someText = "Hello Hello Hello World World World"
ghci> parse (Parsec.char 'H') someText
Right 'H'
ghci> parse (Parsec.char 'e') someText
Left "(source)" (line 1, column 1):
unexpected "H"
expecting "e"
```
`Parsec.char 'H'`返回了一个会匹配单个字符`'H'`的规则。如果我们用这个规则匹配一个以`H`开头的字符串，结果是好的。如果尝试任何不是`H`的字母，就会失败。结果的类型总是`Either ParsecError res`，如果规则成功，则得到`Right result`，失败则得到`Left error`。我们可以试试模式匹配，例子非常简单：

```haskell
main = do
    let result = parse (Parsec.char 'H') "Hello"
    case result of
        Right v -> putStrLn "success!"
        Left err -> putStrLn ("whoops, error: "++show err)
```

### `Parsec.string`

这个函数返回的是尝试匹配字符串的规则：

```haskell
ghci> parse (Parsec.string "hello") "hello world!"
Right "hello"
ghci> parse (Parsec.string "hello") "howdy"
Left "(source)" (line 1, column 1):
unexpected "o"
expecting "hello"
```

Parser从输入中一个一个的消费字符，直到所有的字符都匹配或者某一个字符与预期不符。因为上面的两个尝试都是以`'h'`开头，错误信息是遇到了`unexpected 'o'`。当多个规则串联在一起时，字符的消费(consuming of characters)会变得非常重要。

### `Parsec.oneOf`

有时我们想要匹配多个字符，这时`Parsec.oneOf`就会非常方便。与`Parsec.char`相似，不过参数是`[Char]`类型：

```haskell
ghci> parse (Parsec.oneOf "abcde") "allo"
Right 'a'
ghci> parse (Parsec.oneOf "abcde") "chewy"
Right 'c'
ghci> parse (Parsec.oneOf "abcde") "gnaw"
Left "(source)" (line 1, column 1):
unexpected "g"
```

可以看到，parser会*消费*`abcde`中的任意一个字符。这里我们可以用区间泪简化，比如可以使用`Parsec.oneOf ['a'..'z']`来匹配任意小写字母。

Parsec提供了规则来完成上面的目的，比如，`Parsec.anyChar`会消费任何字符：

```haskell
ghci> parse Parsec.anyChar "blahblah"
Right 'b'
ghci> parse Parsec.anyChar "=-symbols..."
Right '='
```

规则`Parsec.letter`会消费任意字母，`Parsec.lower`会消费小写字母，`Parsec.digit`会消费数字，`Parsec.alphaNum`则是字母和数字。所有这些可以通过`Parsec.oneOf`来手动构建，不过这些提供了更好的错误提示信息（也可以在自己的规则里添加，我们稍后会看到）。

### `Parsec.noneOf`

与上一个相反，这个函数的参数是不允许匹配的字符串，它会匹配任何一个不在参数中的字符。当然也可以使用区间：

```haskell
ghci> parse (Parsec.noneOf ['0'..'9']) "hello"
Right 'h'
ghci> parse (Parsec.noneOf ['0'..'9']) "100"
Left "(source)" (line 1, column 1):
unexpected "1"
```

### `Parsec.many` and `Parsec.many1`

我们有时候会希望不止解析一个字母，`Parsec.many`会不断尝试提供的规则，直到失败位为止。即使一次也没有成功，也不会返回失败，只是给出了一个空的结果。看看如何使用这个：

```haskell
ghci> parse (Parsec.many (Parsec.char 'h')) "hhhheeelllooo!"
Right "hhhh"
ghci> parse (Parsec.many (Parsec.char 'e')) "hhhheeelllooo!"
Right ""
ghci> parse (Parsec.many Parsec.letter) "hhhheeelllooo!"
Right "hhhheeelllooo"
```

就像我们看到的，`Parsec.many`从来不会出错，它总是开心的匹配提供的规则0次，然后什么也不返回。它会尽量往前尝试，并且返回他匹配的任何东西。`Parsec.many1`类似，除了所给的规则至少匹配一次：

```haskell
ghci> parse (Parsec.many1 Parsec.letter) "hello!!"
Right "hello"
ghci> parse (Parsec.many1 Parsec.letter) "75 hello's!"
Left "(source)" (line 1, column 1):
unexpected "7"
expecting letter
```

当想要匹配至少有一个字母或者数字的集合的时候，会非常有用。

### `Parsec.count`

当想要匹配某个东西特定的次数时，可以使用`Parsec.count`。参数是一个数字n和一个规则，期望匹配这个规则相应的次数（或者失败），返回匹配的结果。来个例子：

```haskell
ghci> parse (Parsec.count 4 Parsec.letter) "ahoythere"
Right "ahoy"
ghci> parse (Parsec.count 4 Parsec.letter) "aho"
Left "(source)" (line 1, column 4):
unexpected end of input
expecting letter
```

### `Parsec.manyTill`

这个parser有两参数，尝试匹配的规则以及恰好在这个规则之后的规则。与`many`一样，第一个规则会匹配0次或者多次，但是如果两个规则都不匹配，会报错。下面的例子尝试匹配字母，并期望后面跟着数字：

```haskell
ghci> parse (Parsec.manyTill Parsec.letter Parsec.digit) "hello12345"
Right "hello"
ghci> parse (Parsec.manyTill Parsec.letter Parsec.digit) "12345"
Right ""
ghci> parse (Parsec.manyTill Parsec.letter Parsec.digit) "hello 12345"
Left "(source)" (line 1, column 6):
unexpected " "
expecting digit or letter
```

注意，必须要记住，它会消费（并输出）所有的第一个规则，并且消费第二个规则匹配的任何东西（但是在输出中忽略)。当我们开始把规则串联起来，我们消费了什么，以及下一个规则要处理什么，会变得更加的重要。

我认为Parsec非常好的一点是，它提供了非常直接及时的错误信息，包括我们开头传的字符串（`"(source)"`)，错误的行号列号，以及一些指明哪里错了的有用信息。现在我们只处理了单行inxi，但是从单词的角度出发的酷。

## 组合规则

现在我们已经有了基本规则的经验了，接下来我们聊聊怎么把他们组合起来。Parsec，作为一个monadic，允许我们可以使用Haskell的`do`语法糖来写解析器。下面是一个把上面的简单规则拼凑成一个序列的例子，获取字母数字对并返回：

```haskell
-- This looks for letters, then spaces, then digits.
-- we then return letters and digits in a tuple.
myParser :: Parsec.Parsec String () (String,String)
myParser = do
    letters <- Parsec.many1 Parsec.letter
    Parsec.spaces
    digits <- Parsec.many1 Parsec.digit
    return (letters,digits)
```

注意到我给显式的给了这个parser的类型`Parsec.Parsec String () (String,String)`。这个类型的参数类型，按按顺序来，是输入类型、想要在parser之间保持的一些状态（这里使用的是unit类型，也就是没有有意义的状态，稍后会快速的介绍一下），以及输出类型。在这个例子中，一个`String`作为输入，返回一个两个`String`的元组。在ghci中用`:type`查看这个规则的类型，会看到他们有`ParsecT`类型而不是`Parsec`类型构造的。`ParsecT`只是一个monad transformer，与`Parsec.Parsec`有相同的类型，但是有一个参数`m`来表明其包装的monad。无需多言，这两个类型是一样的：

```haskell
-- I have to import the identity monad to use in the ParsecT definition:
import Control.Monad.Identity (Identity)

myParser1 :: Parsec.ParsecT String () Identity (String,String)
myParser1 = myParser

myParser2 :: Parsec.Parsec String () (String,String)
myParser2 = myParser
```

当在`Parsec`包中查看函数类型时，在脑子里记住这一点，会帮助你理解你在处理什么东西。每个规则都有相似的类型，虽然返回值各个规则都不一样。比如，`Parsec.many`返回一个所有匹配的数组。可以自己在ghci中看看。

不管怎么说，我们已经定义了`myParser`，可以把它传给`parse`函数了：

```haskell
ghci> parse myParser "hello 1000"
Right ("hello","1000")
ghci> parse myParser "woohoooo0!!"
Right ("woohoooo","0")
ghci> parse myParser "1000"
Left "(source)" (line 1, column 1):
unexpected "1"
expecting letter
```

因为我们用的`Parsec.many1`，要求输入至少有一个字母，其后面跟着一个或者多个空格，最后跟着至少一个数字。我们的规则把这些包装成一个元组（但是也可以把他们包装成一个自定义类型或者任何
其他形式）。

假如我们有一系列的字母数字对，被一些分隔符分割，比如逗号。这个例子中，我们想要把他们解析成元组的列表。我们来定义一个解析分隔符的规则

```haskell
mySeparator :: Parsec.Parsec String () ()
mySeparator = do
    Parsec.spaces
    Parsec.char ','
    Parsec.spaces
```

我又添加了显式的类型，因为当我在在测试文件中写独立的调用时，Haskell不能推断出类型。注意，只有最后一行是返回的东西，和签名的类型的是一致。其他之前的parser的返回值被忽略了。当然我们可以在一行显式的`return ()`，不过`Parsec.spaces`已经做了这件事。

这个规则匹配0个或者多个空格，后跟一个逗号，再接着0或多个空格，由于我们不关心这些规则的返回值，我们可以把上面的代码脱糖成一行： 

```haskell
mySeparator = Parsec.spaces >> Parsec.char ',' >> Parsec.spaces
```

现在有了`myParser`和`mySeparator`，每个都是由更小的规则构成的。用同样的方式，我们可以把新的规则组成更大的规则。还是根据上面学到的，来构建一个更冗长的规则：

```haskell
--I want to return a list of pairs, this time.
myPairs :: Parsec.Parsec String () [(String,String)]
myPairs = Parsec.many $ do
    pair <- myParser
    mySeparator
    return pair
```

只是简单的用`Parsec.many`去解析0次或多次`myParser`后面跟着`mySeparator`的实例。注意，我用了`do`的语法糖来构建要给规则，之后把这个规则来传给`Parsec.many`。下面是脱糖的写法，可以清楚的看`do`块是`Parsec.many`的一个参数：

```haskell
myPairs = Parsec.many (myParser >>= \pair -> mySeparator >> return pair)
```

鉴于`Parsec.many`返回一个列表（从类型签名的最后可以看出来），这个结果就是一个`(String, String)`的列表，我们来运行一下：

```haskell
ghci> parse myPairs "hello 1, byebye 2,"
Right [("hello","1"),("byebye","2")]
ghci> parse myPairs ""
Right []
ghci> parse myPairs "hello 1, byebye 2"
Left "(source)" (line 1, column 18):
unexpected end of input
expecting digit, white space or ","
```

可以看到，使用`Parsec.many`，解析器发现没有匹配的实例，是不会报错的。但是如果一旦开始匹配输入了，失败（比如最后缺少了一个分隔符）就会导致报错。像这种普遍的分隔符分割项目的模式，有内置的函数专门进行处理。

### `Parsec.endBy`

接受两个参数，一个解析项目的规则，一个解析分隔符的规则。本质上，`Parsec.endBy`和上面的函数一样，总是期望一个符合规则的字符串，然后一个分隔符，返回一个数组，元素是规则的返回值。

```haskell
-- I want to return a list of pairs as above but using a built in helper:
myPairs2a :: Parsec.Parsec String () [(String,String)]
myPairs2a = Parsec.endBy myParser mySeparator
```

### `Parsec.sepBy`

接受和和`Parsec.endBy`相同的两个参数，但是解析完最后一个项目之后，期望后面不跟着分隔符：

```haskell
-- I want to return a list of pairs without a final separator:
myPairs2b :: Parsec.Parsec String () [(String,String)]
myPairs2b = Parsec.sepBy myParser mySeparator
```

这个规则不要求最后是一个分隔符（实际上，如果最后是个分隔符会报错(注：第二个例子不是原文的例子)：

```
ghci> parse myPairs2b "hello 1, bye 2"
Right [("hello","1"),("bye","2")]
ghci> parse myPairs2b "hello 1, bye 2,"
Left "(source)" (line 1, column 16):
unexpected end of input
expecting white space or letter
```

## 使用`Parsec.choice`和 `<|>`匹配多个规则中的一个

使用`Parsec.choice`或者中缀操作符`Parsec.<|>`（`Control.Applicative`中也有），我们可以解析不止一个规则，而第一个**成功消费输入**的规则会被使用（即使之后失败了也是如此，会得到一个警告）。我们来看看在实践上，它是怎么去掉我们的myParirs规则对结尾的分隔符的需要的：

```haskell
--I want to return a list of pairs with an optional end separator.
myPairs2 :: Parsec.Parsec String () [(String,String)]
myPairs2 = Parsec.many $ do
    pair <- myParser
    Parsec.choice [Parsec.eof, mySeparator]
    return pair
```

现在，我们的规则会消费多个字母数字对，每个后面跟着一个文件结束标记（parsec提供的规则）或则我们定义的分隔符，可以使用中缀操作符：

```haskell
import Text.Parsec (<|>)

myPairs3 :: Parsec.Parsec String () [(String,String)]
myPairs3 = Parsec.many $ do
    pair <- myParser
    Parsec.eof <|> mySeparator
    return pair
```

在这里我引入了`<|>`操作符，所以不用给它加前缀，也没有那么丑了。中缀操作符和`Parsec.choices`都支持多个选择，比如`Parsec.choice [rule1, rule2, rule3]` or `rule1 <|> rule2 <|> rule3`。在两个例子中，序列中第一个消费了输入的规则会被使用。由于接受文件结束标记或者我们自定义的分隔符，结尾不在需要分隔符了：

```haskell
ghci> parse myPairs2 "hello 1, byebye 2,"
Right [("hello","1"),("byebye","2")]
ghci> parse myParis2 "hello 1, byebye 2"
Right [("hello","1"),("byebye","2")]
```

要记住，第一个消费了输入的规则会被使用，这点很重要。这也许会导致出乎意料的失败。比如下面这个例子：

```haskell
parse (Parsec.string "hello" <|> Parsec.string "howdy") "howdy"
```

随便来个人可能会认为这个parser先尝试匹配`"hello"`，并且会失败，然后在匹配`"howdy"`的时候回成功。而实际上，这个解析会完全的失败：

```haskell
ghci> parse (Parsec.string "hello" <|> Parsec.string "howdy") "howdy"
Left "(source)" (line 1, column 1):
unexpected "o"
expecting "hello"
```

这是因为尝试匹配字符串`"hello"`时，`Parsec.string "hello"`创建的规则成功消费了`'h'`，所以这个规则被选择使用，随后在下一个字符匹配失败。下面一个例子会更清楚：

```haskell
ghci> parse (Parsec.string "hello" <|> Parsec.string "bye") "bye"
Right "bye"
```

这里，第一个规则在成功消费任何输入之前就失败了，所以第二个规则被选择没有任何问题。由于性能的原因，默认的情况下，Parsec不会“向前”看一个规则是否匹配。第一个解决方案（可能也是性能最好的）是将任何输入里相同的部分单独解析，然后再解析余下的部分，避免任何超前查看的行为，如：

```haskell
ghci> parse (Parsec.char 'h' >> (Parsec.string "ello" <|> Parsec.string "owdy")) "howdy"
Right "owdy"
```

注意，由于忽略了第一个parser（消费了`'h'`）的结果，所以没有返回整个字符串。如果有必要，这个是很容易改进的，可以把上面的一行标记改成一个更显式的规则：

```haskell
helloOrHowdy :: Parsec.Parsec String () String
helloOrHowdy = do
    first <- Parsec.char 'h'
    rest <- Parsec.string "ello" <|> Parsec.string "owdy"
    return (first:rest)
```

通过手动决定哪些需要从规则里返回，我们可以通过把初始的字符加到余下的字符串上的方式来返回正确的字符串。现在错误也是基于每个规则尝试消费的部分而不是整个字符串，提升了精确性，但是可能损失了清晰性：

```haskell
ghci> parse helloOrHowdy "hello"
Right "hello"
ghci> parse helloOrHowdy "allo"
Left "(source)" (line 1, column 1):
unexpected "a"
expecting "h"
ghci> parse helloOrHowdy "hoops"
Left "(source)" (line 1, column 2):
unexpected "o"
expecting "owdy"
```

第一个错来自`Parsec.char`，第二个则是`Parsec.string`。之后我们会展示如何提供自定义的错误信息，但我们先来看看超前查看这种更整洁的解析这些字符串的方式。

### `Parsec.try`

当规则变得复杂时，避免超前查看会很快变得笨重。在这些情形下，我们可以命令Parsec尝试一个规则，并且如果规则匹配失败，则回退到之前的状态。`Parsec.try`就是做的这件事，它会catch任何失败，并且回退。考虑到性能的影响，最好是把超前查看保持在一个尽可能小的范围内，`try`函数中的可能的解析越少越好。`Parsec.try`把被包入的规则的报错信息都截获了，因此如果不正确使用的话，可能会导致产生奇怪并且没有任何帮助的错误信息。这个意思是，如果使用得当，我们能够体验到良好的错误信息的优点，我们来试一下：

```haskell
helloOrHowdy2 :: Parsec.Parsec String () String
helloOrHowdy2 = Parsec.try (Parsec.string "hello") <|> Parsec.string "howdy"
```

这个会产生正确的解析，通常也会有更好的错误信息，但是既然任何一个解析`"hello"`的失败都被拦截了，错误信息只会描述`choice`操作符或者`"howdy"`的匹配失败，忽略配`"hello"`的匹配损失败：

```haskell
ghci> parse helloOrHowdy2 "hello"
Right "hello"
ghci> parse helloOrHowdy2 "howdy"
Right "howdy"
ghci> parse helloOrHowdy2 "boo!"
Left "(source)" (line 1, column 1):
unexpected "b"
expecting "hello" or "howdy"
ghci> parse helloOrHowdy2 "hellay"
Left "(source)" (line 1, column 1):
unexpected "e"
expecting "howdy"
```

### 通过`<?>`操作符自定义错误信息

有时候，通常在构建自己的规则是，会想要用自己定义的匹配失败的错误信息。`<?>`操作符允许把一个自定义错误信息很简单的附加到任何一个规则上。我们来看看实际效果：

```haskell
ghci> parse (Parsec.string "hello") "wrongstring"
Left "(source)" (line 1, column 1):
unexpected "w"
expecting "hello"
ghci> parse (Parsec.string "hello" <?> "a common greeting") "wrongstring"
Left "(source)" (line 1, column 1):
unexpected "w"
expecting a common greeting
```

我们简单的把一个错误信息附加到了一个`Parsec.string`产生的规则上。`<?>`的优先级是最低的，以为这任何其他的东西都会优先求值。以把一个新的错误信息附加到由`<|>`产生的规则链为例，那么当所有的规则都匹配失败了并且*没有消费任何输入*，这个错误信息才会被使用。只要有一个规则消费了输入，那么这个规则的错误信息将会用来描述整体的失败（当然除了这个规则被`try`包了起来）。这个基本的例子说明了这个事实：

```haskell
ghci> -- this fails without consuming any input:
ghci> parse (Parsec.string "apple" <|> Parsec.string "bat" <?> "boom!") "cat"
Left "(source)" (line 1, column 1):
unexpected "c"
expecting boom!
ghci> -- this consumes input before failing:
ghci> parse (Parsec.string "apple" <|> Parsec.string "bat" <?> "boom!") "aunty"
Left "(source)" (line 1, column 1):
unexpected "u"
expecting "apple"
```

如果想要给创建的规则一个自定义的错误信息，可以把规则装进`try`里，catch这些可能的错误信息，并且提供自己的错误信息。这儿有一个简单的例子：

```haskell
-- here we parse a basic greeting with no custom errors:
greeting :: Parsec.Parsec String () String
greeting = do
    Parsec.char 'h'
    Parsec.string "olla" <|> Parsec.string "ello"
    return "greeting"

--parse the same greeting, but wrap in try and add custom error:
greeting2 :: Parsec.Parsec String () String
greeting2 = Parsec.try greeting <?> "a greeting!"
```

这种做做法对于更重要的规则并不推荐，因为来自子规则的精确的错误信息会被更一般且较少帮助信息的错误信息替换掉。然而，当构建小的规则时，提供自己的错误信息会比`Parsec`提供的更有描述性。

## 利用applicative函数做到更简洁的解析

模块`Control.Applicative`引入了几个函数，多数是中缀操作符，在正确的场合，这些可以让规则更简洁可读。很明显我明已经使用过了这样的一个操作符`<|>`。Applicative函数常常使得代码变短，因为他们都是与point-free相关的，也就是不显式的引用传入的参数。

我们来把最初的parser改成applicative形式，看看每个操作符干了什么：

```haskell
-- lets start again with our first parser to parse a letter/digit pair:
myParser :: Parsec.Parsec String () (String,String)
myParser = do
    letters <- Parsec.many1 Parsec.letter
    Parsec.spaces
    digits <- Parsec.many1 Parsec.digit
    return (letters,digits)

-- in applicative style:
myParserApp :: Parsec.Parsec String () (String,String)
myParserApp = (,) <$> Parsec.many1 Parsec.letter <*> (Parsec.spaces *> Parsec.many1 Parsec.digit)

-- could also be written as:
myParserApp2 :: Parsec.Parsec String () (String,String)
myParserApp2 = liftA2 (,) (Parsec.many1 Parsec.letter) (Parsec.spaces *> Parsec.many1 Parsec.digit)

-- or even (swapping *> for the more familiar >>):
myParserApp :: Parsec.Parsec String () (String,String)
myParserApp2 = liftA2 (,) (Parsec.many1 Parsec.letter) (Parsec.spaces >> Parsec.many1 Parsec.digit)
```

我们来一个一个看看主要的applicative操作符，看看它们到底干了什么事：

### `<$>`和`<*>`

这个操作符本质上是`fmap`。左操作数是一个函数，右操作数是一个规则，并把规则的结果在返回之前传给这个函数（当规则匹配成功时，如果匹配失败，则是得到一个解析错误）。如果想要把这个函数应用到多个参数，用`<*>`分割参数。来看看ghci中的例子：

```haskell
ghci> -- apply the result to a tuple constructor:
ghci> parse ((,) <$> Parsec.char 'a' <*> Parsec.char 'b') "ab"
Right ('a','b')
ghci> -- put the result into an array:
ghci> parse ((\a b -> [a,b]) <$> Parsec.char 'a' <*> Parsec.char 'b') "ab"
Right "ab"
```

整洁的一点就是无论需要多少个参数，都可以在通过在后面加一个`<*>`来串联起来。

### `liftAx`

上面的一个前缀版本，`liftAx`接受*x*个后续参数，并把他们传给第一个。没有中缀版本那么灵活，但是有时会更加可读。这是一个和上面完全一样的例子：

```haskell
ghci> -- apply the result to a tuple constructor:
ghci> parse (liftA2 (,) (Parsec.char 'a') (Parsec.char 'b')) "ab"
Right ('a','b')
ghci> -- put the result into an array:
ghci> parse (liftA2 (\a b -> [a,b]) (Parsec.char 'a') (Parsec.char 'b')) "ab"
Right "ab"
```

### `<*`和`*>`

有时会想要匹配一下规则，除了其中的一个，其余的结果都扔掉。这两个操作符接受两个规则，并且返回尖括号指向的规则的结果。例子：

```haskell
ghci> parse (Parsec.char 'a' <* Parsec.char 'b') "ab"
Right 'a'
ghci> parse (Parsec.char 'a' *> Parsec.char 'b') "ab"
Right 'b'
```

同样可以串联起来，这样可以忽略几个规则：

```haskell
ghci> parse (Parsec.char 'a' <* Parsec.char 'b' <* Parsec.char 'c') "abc"
Right 'a'
ghci> parse (Parsec.char 'a' *> Parsec.char 'b' <* Parsec.char 'c') "abc"
Right 'b'
ghci> parse (Parsec.char 'a' *> Parsec.char 'b' *> Parsec.char 'c') "abc"
Right 'c'
```

当想要做一些类似去空格什么的或者从一些片段中提取某个片段的时候，这个经常会会特别方便。

### `<$`

匹配右边的规则，并且如果左边的规则匹配成功，则返回左边的结果。我们来看看做这个事情的一些等价的方式：

```haskell
ghci> parse ("greeting!" <$ Parsec.string "hello") "hello"
Right "greeting!"
ghci> parse (Parsec.string "hello" >> return "greeting!") "hello"
Right "greeting!"
ghci> parse (return "greeting!" <* Parsec.string "hello") "hello"
Right "greeting!"
```

可以看到，这些不同的方式都没有减少代码。我自己会选用更明显的第二种方式，虽然它比第一种长了一些，但是你们自己随意。

## 处理状态

最近我了解到可以在parser之间保持状态。当需要跟踪某个事情时，这非常有用，比如缩进的层数。这是一个非常简单的利用状态数字母的例子：

```haskell
-- matches char 'h', incrementing int state by 1
-- each time one is seen.
hCountParser :: Parsec.Parsec String Int ()
hCountParser = do
    Parsec.char 'h'
    c <- Parsec.getState
    let c' = c+1
    Parsec.putState c'
    return ()

-- parse as many h's as we can, then return the state
-- to see how many there were
Parsec.runParser (Parsec.many hCountParser >> Parsec.getState) 0 "" "hhhhhhhhhhhhellooo"
```

对于`get`and`set`，我们可以用`Parsec.modifyState`来原地修改状态。一个hCountParser简单的版本：

```haskell
hCountParser' :: Parsec.Parsec String Int ()
hCountParser' = do
    Parsec.char 'h'
    Parsec.modifyState (+1)
    return ()
```

值得注意的是，作为一个monad transformer，我们也有这样一个选择，把parser和类似于`State`  monad的东西结合，来保存状态。这种方式与monad transformer的做事方式更一致。使用`State` monad，则是下面这样：

```haskell
import Control.Monad       (lift)
import Control.Monad.State as S

hCountParser'' :: Parsec.ParsecT String () (S.State Int) ()
hCountParser'' = do
    char 'h'
    lift $ modify (+1)

-- after running our parser transformer, we get back our unevaluated inner state, which
-- contains our parser result and state ('h' count). We only want the state so
-- we use execState rather than runState or evalState to execute and unwrap the state monad,
-- providing an initial state to start the ball rolling.
S.execState (Parsec.runParserT (Parsec.many hCountParser2) () "" "hhhhhhhhhhhhellooo") 0
```

## 总结

我们已经了解了一些内置的函数和规则，之后又看了看如何通过组合规则来构建大的规则，包括在多个规则之中选择、通过`try`来超前查看，最后添加了向自己的规则添加自定义的错误信息，并且快速的尝试了一下保存状态。有了以上的经验，接下来应该会很容易了！

我建议在ghci下，通过别名引入`Parsec`模块（或者qualified引入）并且使用tab键来获得`Parsec`提供的所有东西，详细考察`Parsec`的函数。对这些函数使用`:type`，会让你对其有更深的理解，同样也是我探索这么多的函数的基础。*Real World Haskell*的这一章（[英文版][]，[中文版][]）也是非常好的教程，并且有更为大量的实际例子，虽然其中的一小部分已经过时了。

我希望这篇文章能给你提供帮助。如果我漏掉了什么，请留下你的评论，让我知道！

[这个文件]: https://jsdw.github.io/unbuilt-posts/haskell-parsec-basics/examples.hs
[英文版]: http://book.realworldhaskell.org/read/using-parsec.html
[中文版]: http://cnhaskell.com/chp/16.html