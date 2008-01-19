/**
 *  e4xd javascript server-side - openmocha reduced to the max
 * 
 *  Copyright 2008 Chris Zumbrunn <chris@zumbrunn.com> http://zumbrunn.com
 *  version 0.7, January 19, 2008
 * 
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

About e4xd

A new and experimental core for a complete rewrite of Openmocha. 

The e4xd sub-project provides the javascript server-side for the 
Openmocha project, a javascript application server with a soft-coding 
framework and a web-based soft-coding environment. 

With e4xd, additional file naming conventions are leveraged to map 
different types of content in a context that automatically forms 
conditional dependencies. These results are made available as 
properties of Mocha objects, instances inheriting from the Mocha 
prototype, and changes to Mocha object properties are mapped back 
to the persistence back-end in a way that is optimized for the kind 
of soft-coding inheritance that builds the core of Openmocha.

The jhino sub-project provides a base application scaffold for the 
soft-coding environment. It leverages the e4xd object engine and adds 
an additional layer of conventions that results in a basic scaffold 
for a working base application. Basically, jhino already provides a 
fully working soft-coding environment, but requires the standard Helma 
development tools such as the shell and inspector to do the actual 
"soft-coding".

The e4xd javascript server-side currently requires a patched version 
of Helma and Rhino. In the case of Rhino, e4xd depends on the JOMP 
patch and Helma needs to be modified to do the additional file suffix 
mapping required by e4xd.

http://dev.helma.org/wiki/Comparison+of+JSAdapter+and+JOMP/
http://e4xd.googlecode.com/svn/trunk/patches/helma.txt


How to get e4xd working

You should soon be able to find a working build to download and 
simply start with ./start.sh somewhere on the e4xd.org site.

http://e4xd.org/

Otherwise, you would need to build the patched versions of Rhino and 
Helma and replace the rhino.jar in the Helma build with the patched 
version you built. 

The "objectengine" and "jhino" modules are expected to be placed in 
Helma's modules directory and the exampleapp would normally go into 
Helma's apps directory. 

You could then start the exmaple app from your manage application 
or add it to the apps.properties file to have it start automatically.

http://localhost:8080/exampleapp


More info and help

Other than what you find on the (possibly not yet existing) e4xd.org 
website, the best places to get in touch are the openmocha mailing 
list and google group or the #helma@irc.freenode.net IRC channel. 

http://groups.google.com/group/openmocha
irc://irc.freenode.net/helma
http://helma.zumbrunn.com/hopbot/

Also, in case you are new to Helma, you of course need to add the 
helma.org website and mailing lists to the top of that list.

http://helma.org/

To get in touch with me directly, you should find additional contact 
information on the zumbrunn.com site.

Chris Zumbrunn <chris@zumbrunn.com> http://zumbrunn.com
