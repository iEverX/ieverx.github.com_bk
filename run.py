#! /usr/bin/env python3
# coding: utf-8

import argparse
from datetime import date
from os import path


post_tpl = '''---
layout: post
title:
tags: []
---

'''


def new_post(title):
    d = date.today().strftime('%Y-%m-%d')
    title = '-'.join(x.lower() for x in title.split())
    filename = '_posts/%s-%s.md' % (d, title)

    if path.isfile(filename):
        print('File already exists.')
    else:
        with open(filename, 'w', encoding='utf-8') as fout:
            fout.write(post_tpl)
        print('File %s created.' % filename)


def parse():
    parser = argparse.ArgumentParser(description='util commands')
    parser.add_argument('--new', dest='title')
    return parser.parse_args()


def main():
    args = parse()

    if 'title' in args:
        new_post(args.title)


if __name__ == '__main__':
    main()
