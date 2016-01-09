---
layout: post
title: "编译Linux内核"
tagline: "Compiling Linux Kernel"
description: "Linux内核编译的步骤以及一些相关问题的解决办法"
tags: ["Linux", "内核", "编译源码"]
---

这几天实验室交给任务，编译linux内核。然后就开始做了。

师兄给了两篇参考文章，[这篇][1]和[这篇][2]。第一篇比较简略，说了总体的过程，而第二篇比较而言就比较详细了。

好了，现在说说自己的编译的过程吧。

### 一、下载源码并解压
源码从[这里][kernel]下载，我下载的是最新的3.5-rc6。具体那个版本都是差不多的。然后需要把源码解压到/usr/src这个目录下，我是ubuntu用户，其他发行版相似


    sudo cp /path/to/file/linux-3.5-rc6.tar.bz2 /usr/src
    sudo tar jxvf linux-3.5-rc6
    cd linux-3.5-rc6/  # 进入源码的目录，以后所有操作均在该目录下完成
    

### 二、删除之前编译的残留文件

    sudo make mrproper
 
如果是第一次编译的话，可以不用执行这一步。而如果之前曾经编译过，务必执行这一步，清除残留文件，否则可能会导致编译失败。

### 三、配置编译选项

    sudo make config
    sudo make menuconfig
    sudo make xconfig


这三个命令任选一个执行就好了。区别是

 * make config  
 问答式的配置，选错之后无法更改，所以一般人都不会用这个。

 * make menuconfig  
 这个命令需要ncurses库的支持，ncurses是字符界面下的图形界面库。可以通过`apt-get install libncurses5-dev`来安装。ncurses是字符界面下的图形界面库，所以如果使用的字符控制台，就可以用选用menuconfig了

 * make xconfig  
 这个命令需要Qt，这是个跨平台的图形界面库。可以通过`sudo apt-get install libqt...`来安装，具体是那个包忘记了。xconfig就是图形界面下的配置环境了。

xconfig用着最舒服，menugconfig也可以，不过界面难看了些。config自己没用过，也不推荐用。

这一步其实应该是很重要的一步，不过由于选项众多，且众多选项和硬件相关，需要有足够的硬件知识，并且对自己电脑的硬件配置有足够的了解才可能完全配置的好。网上有许多专门讲这一步的文章，比如[金步国的这篇经典文章][金步国]，不过由于版本还是2.6，所以有许多选项文章里面没有讲到。

由于本人是个菜鸟，对于硬件以及其他的知识都不是很清楚，再加上这么多的选项，所以大部分都是默认的选项。当然，这样就使得modules过多，使得之后的make modules的时候花费了大量的时间。所以应该尽量的减少不需要的模块，特便是其中的许多针对不同的硬件的驱动。

### 四、编译内核
    sudo make bzImage

在我参考的第二篇文章中说，他编译出来的内核大约在800k-900k左右，可是实际上我编译出来的内核一般在4500k左右。可能是由于版本的差异吧，不用纠结在这个上面。

在编译结束后，会告诉你bzImage的位置，然后执行

    sudo cp /path/to/bzImage /boot/vmlinuz-3.5-rc6

把其放到/boot目录下。这里我把它重命名为vmlinuz-3.5-rc6？为什么是这个名字？自己看看/boot，更深层原因我也不知道了。

### 五、编译模块

    sudo make modules

上边也说了，这个阶段的时间是和配置选项那一步中选择的模块的多少直接相关的。有时可能会遇到rts5139.ko undefined的错误，可以在配置选项时去掉rts5139这个模块。

### 六、安装模块

    sudo make modules_install

这一步没什么说的。有时可能会出错，并让你make CONFIG_MISMATCH=y(这个选项记不清了，不过差不多了)，可以不用理。

### 七、安装内核
    sudo make install

这一步比较快。在这一步，系统会自动更新grub。

如果以上完全弄好了，那么就可以重启进入新的内核体验了。不过有的同学在重启后可能会遇到这样一个问题，就是无法进入图形界面了。
提示类似如"ubuntu run in a low-graphic mode","Your screen, graphic card, input devices cannot detected correctly. You need configure it yourself."等等。
这时可以Ctrl-Alt-F1或者Alt-F1进入控制台，`sudo apt-get install gdm`之后选择gdm即可。如果还不能解决问题，对于ATI显卡，可以安装fglrx。由于我不是ATI的显卡，所以是否可行我就不是很清楚了。更具体的可以google之。

[1]: http://syshack.blog.51cto.com/304393/144321/ 
[2]: http://bbs.chinaunix.net/thread-2264758-1-1.html
[kernel]: http://kernel.org
[金步国]: http://tmdnet.nothave.com/man/Linux%202_6_19_x%20%E5%86%85%E6%A0%B8%E7%BC%96%E8%AF%91%E9%85%8D%E7%BD%AE%E9%80%89%E9%A1%B9%E7%AE%80%E4%BB%8B.htm
