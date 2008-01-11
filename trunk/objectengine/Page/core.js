/**
 *  e4xd javascript server-side - openmocha reduced to the max
 * 
 *  Copyright 2008 Chris Zumbrunn <chris@zumbrunn.com> http://zumbrunn.com
 *  version 0.1, January 11, 2008
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
 * Resolves url path to page's child element with matching name
 */
function getChildElement(name) {
    return this.get(name);
}


/**
 * Resolves requests to soft-coded actions before hard-coded ones are invoked
 */
function OLDTESTonRequest() {
    // let soft-coded actions override
    if (req.action == 'notfound' && this.actions[req.action]){
        this.actions[req.action].call(this);
        res.stop();
    }
}


/**
 * Resolve requests with no automatic match
 */
function notfound_action(){
    var action, output, name;
    
    // setup path names to look through
    var names = req.path.split('/');
    
    // resolve path names against the object hierarchy
    var page = root;
    do {
        if (page.get(names[0]))
            page = page.get(names[0]);
        else
            break;
    }
    while (names.shift());
    
    // handle idempotent requests as such
    idempotentAction = names[0] +='_'+ req.method.toLowerCase();
    
    // call a softcoded action
    if (page.actions[idempotentAction])
        page.actions[idempotentAction].call(page,names);
    else if (page.actions[names[0]])
        page.actions[names[0]].call(page,names);
    else {
        output = page.views[names[0]];
        if (output.toXMLString())
            res.write(output);
        else 
            res.redirect(page.href());
    }
}


/**
 * Renders an e4x object from the specified skin object
 */
function render(skin) {
    return new XML(this.renderSkinAsString(skin));
}


/**
 * Provides the an array of the path breadcrumbs from
 * the this Page object up to the root object.
 */
Page.prototype.__defineGetter__('path',function() {
    var breadcrumbs = [];
    var page = this;
    do {
        breadcrumbs.push(page);
    }
    while (page = page._parent);
    
    return breadcrumbs;
});


/**
 * Resolver getters and setters
 */
Page.resolver = function(handle){
    // build resolver function
    var fnc = function() {
        
        // setup closure for current page instance
        var page = this;
    
        // define metaproperty handlers
        var obj = {__metaobject__:{
        
            // define getter for metaproperties
            get : function(thisObj,prop) {
                if (thisObj[prop])
                    return thisObj[prop];
                
                if (!prop)
                    return prop;
                
                var idempotentSuffix = (handle == 'actions' && (
                        prop.endsWith('_get')
                        || prop.endsWith('_post')
                        || prop.endsWith('_put')
                        || prop.endsWith('_delete')))
                    ? prop.slice(prop.lastIndexOf('_')+1) 
                    : '';
                
                var property, overrider;
                
                // lookup an overriding property in this instance's path
                var next = page;
                do {
                    // first check if we are looking for idempotent action methods
                    if (idempotentSuffix) {
                        // and then if their is an idempotent override
                        if (next.hasOwnProperty(prop)) {
                            overrider = next;
                            break;
                        }
                    }
                    // then take care of the views, macros, controls and standard actions
                    else if (next.hasOwnProperty(prop +'_'+ handle.slice(0,-1))) {
                        overrider = next;
                        break;
                    }
                }
                while (next = next._parent);
                
                if (handle == 'views') {
                    
                    // use an overriding view or set default
                    if (overrider)
                        property = createSkin(overrider[prop +'_'+ handle.slice(0,-1)]);
                    else 
                        property = prop;
                    
                    // if there is a control for this view, let it handle it first
                    if (page.controls[prop])
                        property = page.controls[prop].call(page,property);
                    
                    // render the view to e4x if the control has not done so already
                    if (typeof property != 'xml')
                        property = page.render(property);
                }
                else {
                    // first handle overrides for idempotent action methods
                    if (overrider && idempotentSuffix)
                        property = overrider[prop];
                        
                    // then overrides for macros, controls and standard actions
                    else if (overrider)
                        property = overrider[prop +'_'+ handle.slice(0,-1)];
                        
                    // then idempotent action methods inherited from the prototype chain
                    else if (idempotentSuffix)
                        property = page[prop.slice(0,prop.lastIndexOf('_')) +'_action_'+ idempotentSuffix];
                    
                    // then macros, controls and standard actions methods inherited from the prototype chain
                    else 
                        property = page[prop +'_'+ handle.slice(0,-1)];
                }
                
                // return the resolved property
                return property;
            },
                
            // define setter for metaproperties
            set : function(thisObj,prop,value) {
                
                // set the idempotent action
                if (prop.endsWith('_get')
                        || prop.endsWith('_post')
                        || prop.endsWith('_put')
                        || prop.endsWith('_delete'))
                    page[prop] = value;
                // or set views, controls and standard actions
                else
                    page[prop +'_'+ handle.slice(0,-1)] = value;
            }
        }};
        
        // return object containing metaproperty handlers
        return obj;
    }
    // return the built resolver function
    return fnc;
}


/**
 * Handles views object, resolving to appropriate getters and setters
 */
Page.prototype.__defineGetter__('views',Page.resolver('views'))


/**
 * Handles controls object, resolving to appropriate getters and setters
 */
Page.prototype.__defineGetter__('controls',Page.resolver('controls'))


/**
 * Handles actions object, resolving to appropriate getters and setters
 */
Page.prototype.__defineGetter__('actions',Page.resolver('actions'))


/**
 * Handles macros object, resolving to appropriate getters and setters
 */
Page.prototype.__defineGetter__('macros',Page.resolver('macros'))


/**
 * Serialize otherwise unpersisted objects with matching suffixes
 */
function onPersist(){ 
    for (var i in this) {
        if (i.endsWith('_json'))
            this[i+'_'] = this[i].toJSON();
        else if (i.endsWith('_e4x'))
            this[i+'_'] = this[i].toXMLString();
        else if (i.endsWith('_action')
            || i.endsWith('_action_get')
            || i.endsWith('_action_post')
            || i.endsWith('_action_put')
            || i.endsWith('_action_delete')
            || i.endsWith('_control')
            || i.endsWith('_macro'))
            this[i+'_'] = this[i].toSource()
                .slice(this[i].toSource().indexOf('{')+1,
                    this[i].toSource().lastIndexOf('}'))
    }
}


/**
 * Unserialize specially persisted objects with matching suffixes
 */
function onInit() {
    for (var i in this) {
        if (i.endsWith('_json_'))
            this[i.slice(0,-1)] = this[i].parseJSON();
        else if (i.endsWith('_e4x_'))
            this[i.slice(0,-1)] = new XML(this[i]);
        else if (i.endsWith('_action_')
            || i.endsWith('_action_get_')
            || i.endsWith('_action_post_')
            || i.endsWith('_action_put_')
            || i.endsWith('_action_delete_')
            || i.endsWith('_control_')
            || i.endsWith('_macro_'))
            this[i.slice(0,-1)] = new Function(this[i]);
    }
}

