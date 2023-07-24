<img src="https://avatars0.githubusercontent.com/u/16848901?s=460&u=acaf05c1e801337a7f6a87676ec886ccba9c641e&v=4" width="100p">

# Spin the Web
_An unopinioneted integrator of internet technologies_

Spin the Web deals with the Webbase Description Language (WBDL). Simply put, HTML describes a web page, WBDL, a web site; and, while HTML is interpreted by a client side web browser, WBDL, by a server side _web spinner_. It is this project opinion that WBDL is a missing component in the World Wide Web space.

It must be stressed that WBDL does not replace any technology, it coordinates technologies; it focuses on _contents_ (rendered data units), defining what they are, how they are organized, and where, how and when they are rendered. Web spinners output contents on request.

WBDL can describe web sites, intranets, extranets, portals, web apps, web services, here collectively referred to as _webos_. It is a fundamental language for Content Management Systems (CMS). 

The term _webbase_ was first used in 1998, a name given to a relational database whose schema defined a webo: its structure, content, layout, localization, navigation and security aspects. Later, to ease portability, the webbase was formalized into the XML based Webbase Description Language (WBDL), this introduced the term _webbaselet_, a webbase fragment.

## Features
* Content centered
* Role Based Access Control
* Multilingual & Multinational (localized)
* Templated

## Elements
Spin the Web addresses three issues to ease web develpments: describe, interpret and build. It is based on pillars of web development, HTML (SVG), CSS, Javascript, to name a few, it is not for the faint of heart, a good dose of knowhow is necessary, full stack development knowhow.

A _webbase_ is an hierachically organized structure of three base elements, plus one: _areas_, _pages_ and _contents_, the additional element is _reference_, it points to any of the three base elements; at the root of the hierarchy there is always a fifth element, the _webo_. The file system analogy may be of help: the _webo_ is the drive, _areas_ are folders, _pages_ are files, _contents_ and _references_, are something else! Like the file system, a webbase also addresses security, role level security, based on a simple inherited visibility paradigm.

## Contents
_Contents_ are central, they come in four flavors: _navigational_, _organizational_, _presentational_ and _special_. The purpose of contents is to allow _interaction_ with data of any kind, they request data, provide data, they can be simple microservices, dashbords that are described macroscopically by (WBDL) Webbase Description Language and microscopically (WBLL) Webbase Layout Language

* navigational &mdash; these content render as menubars, links, breadcrumbs, image maps
* organizational &mdash; these contents render as calendars, tabs, group
* presentational &mdash; these contents render as forms, lists, tables, graphs 
* special &mdash; these contents can be client side scripts and API

## Paradigm
A web spinner receives a request from a client, these are the logical steps that follow: 
* If the request is the first request sent by the client, a session is established thus defining the _session context_
* The web spinner, subject to the session context, consults the WBDL file and responds with either: a list of REST calls the client should make or a resource
* If the client receives a list of REST calls, it sends requests for each of them asynchronously
* Else it receives a resource
* The _session context_ holds the connected user, its associated roles and locale.
