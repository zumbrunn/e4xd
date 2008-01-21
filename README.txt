/**
 *  e4xd javascript server-side - openmocha reduced to the max
 * 
 *  Copyright 2008 Chris Zumbrunn <chris@zumbrunn.com> http://zumbrunn.com
 *  version 0.7, January 21, 2008
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

*** About e4xd and jhino

A new and experimental core for a complete rewrite of Openmocha. 

The e4xd sub-project provides the javascript server-side for 
the Openmocha project, a javascript application server with a 
"soft-coding" framework.

The soft-coding allows modifications and development work from the 
"inside" of the running web application. The behavior of the web
application can be changed in ways that closely relates to the 
hierarchical content structure of the resulting website, without 
the need to "hard-code" these changes in code files.

Every content object becomes "sovereign" and can define its own 
behavior, overriding what it would inherit from the hard-coded 
prototypes or from other soft-coded objects higher up in the 
content structure hierarchy.

The e4xd objectengine leverages naming conventions for hard-coded 
filenames and soft-coded object property names to overlay the
hard-coded and soft-coded properties and methods and determine 
the behavior of an object at runtime.

Internally, these conventions follow the existing ones of the Helma 
framework, but expand that philosophy, adding additional conventions 
and accomodating to the needs of the soft-coding environment.

The jhino sub-project provides a base application scaffold for the 
soft-coding environment. It leverages the e4xd object engine and adds 
an additional layer of conventions, resulting in a basic scaffold 
for a working base application with CRUD type functionality and 
access control. Basically, jhino already provides a fully working 
soft-coding environment, but requires the standard Helma development 
tools such as the shell and inspector to do the actual "soft-coding".

The e4xd javascript server-side currently requires a patched version 
of Helma and Rhino. In the case of Rhino, e4xd depends on the JOMP 
patch and Helma needs to be modified to do the additional file suffix 
mapping required by e4xd.

http://dev.helma.org/wiki/Comparison+of+JSAdapter+and+JOMP/
http://dev.helma.org/static/files/2302/helma.txt


*** How to get e4xd working

On the e4xd.org site, you should be able to find a working build to 
download and simply start with ./start.sh

http://e4xd.org/

In addition to the full openmocha build, there is also a build that
contains only the jhino modules and patched jar files, in order to 
add jhino to your own helma install. You would need to replace the 
helma.jar and rhino.jar in your Helma install with the patched 
versions. The "objectengine" and "jhino" modules are expected 
to be placed in Helma's modules directory and the exampleapp would 
normally go into Helma's apps directory. You could then start the 
example app from your manage application or add it to the 
apps.properties file to have it start automatically.

http://localhost:8080/exampleapp


*** More info and help

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
