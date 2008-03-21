/**
 *  e4xd javascript server-side - openmocha reduced to the max
 * 
 *  Copyright 2008 Chris Zumbrunn <chris@zumbrunn.com> http://zumbrunn.com
 *  version 0.9, March 4, 2008
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


/**
 * Renders the default page template
 */
function renderPage() {
    res.writeln('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"\n\
       "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">');
    res.write(String.fromE4X(this.views.page));
}


/**
 * Renders an object for sending to the client
 */
function render(view) {
    
    if (typeof view == 'xml')
        return view;
    
    // render functions for client-side use
    if (view instanceof Function)
        return this.renderSkinAsString(createSkin(view.toSource()));
    
    // attempt to render skin as xml object
    var e4x;
    var skin = this.renderSkinAsString(view);
    
    if (skin)
        try {
            e4x = eval('<>'+skin+'</>');
        }
        catch(e) {
            e4x = new XML('<span class="failedView">'+ skin 
                + '<script>\
                    if (window.console) \
                        console.log(\'Failed view '+view+': '+e+'\')\
                   </script></span>');
        }
    else
        e4x = new XML();
    
    return e4x;
}


/**
 * Returns the prototype chain as an array
 * 
 * @return Array
 */
function getPrototypeChain(){
    var protoChain = [];
    var proto = this.__proto__;
    do {
        protoChain.push(proto);
        proto = proto.__proto__;
    }
    while (proto != Object.prototype)
    return protoChain;
}


/**
 * Calls the overridden version of a method in the prototype chain
 */
function callSuper(name,view,fnc) {
    var superfnc;
    var chain = this.getPrototypeChain();
    var passedMatch = false;
    
    for (var proto in chain) {
        if (fnc == chain[proto][name])
            passedMatch = true;
        else if (passedMatch) {
            superfnc = chain[proto][name];
            break;
        }
    }
    
    return superfnc ? superfnc.call(this,view) : view;
}


/**
 * Provides an array of the path breadcrumbs from
 * the this Mocha object up to the root object.
 */
Mocha.prototype.__defineGetter__('path',function() {
    var breadcrumbs = [];
    var obj = this;
    do {
        breadcrumbs.push(obj);
    }
    while (obj = obj._parent);
    
    return breadcrumbs;
});


/**
 * Returns an E4X XMLList object from this string
 * 
 * Any entities and other ampersands are escaped
 * 
 * @return XMLList
 */
String.prototype.toE4X = function() {
    return new XMLList(this.replace(/&/g,";;ampersand;;"));
}


/**
 * Returns an string rendered from the provided E4X object
 * 
 * Any entities and other ampersands are unescaped
 * 
 * @param {XML} xml the XML or XMLList object to convert
 * @return String
 */
String.fromE4X = function(xml) {
    var string = xml.toXMLString()
        .replace(/;;ampersand;;/g,'&')
        .replace(/<textarea(.*)\/>/g,'<textarea$1></textarea>')
        .replace(/<script(.*)\/>/g,'<script$1></script>')
    return string;
}



