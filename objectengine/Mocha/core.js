/**
 *  e4xd javascript server-side - openmocha reduced to the max
 * 
 *  Copyright 2008 Chris Zumbrunn <chris@zumbrunn.com> http://zumbrunn.com
 *  version 0.7, January 22, 2008
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
 * Resolves url path to child element with matching name
 */
function getChildElement(name) {
    var obj = this.get(name);
    
    // only resolve to the object if a renderPage method is implemented
    if (obj && obj.renderPage)
        return obj;
}


/**
 * Resolves requests to soft-coded actions before hard-coded ones are invoked
 */
function onRequest() {
    if (req.action != 'notfound') {
        
        // sets the actually resolved action, as it is also set by notfound
        req.data.action = req.action;
        
        // let soft-coded actions override
        var idempotentAction = req.action +'_'+ req.method.toLowerCase();
        var action = (this.actions[idempotentAction] || this.actions[req.action]);
        
        if (action) {
            action.call(this);
            res.stop();
        }
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
    var obj = root;
    do {
        if (obj.get(names[0]))
            obj = obj.get(names[0]);
        else
            break;
    }
    while (names.shift());
    
    if (!obj.render)
        res.redirect(obj._parent.href());
    
    req.data.action = names[0] || 'main';
    
    // handle idempotent requests as such
    idempotentAction = req.data.action +'_'+ req.method.toLowerCase();
    
    // call a softcoded idempotent action
    if (obj.actions[idempotentAction])
        obj.actions[idempotentAction].call(obj,names);
        
    // call a softcoded standard action
    else if (obj.actions[req.data.action])
        obj.actions[req.data.action].call(obj,names);
    
    else {
        // render auto-action-enabled views 
        if (obj.actionviews_json 
                && obj.actionviews_json[req.data.action] 
                && obj.access[req.data.action].check())
            obj.renderPage();
        
        // if the main action was denied, redirect to the login
        else if (req.data.action == 'main')
            res.redirect(obj.href('login'));
        
        // otherwise redirect to the main action
        else 
            res.redirect(obj.href());
    }
}


/**
 * Renders an e4x object from the specified skin object
 */
function render(view) {
    var e4x;
    var skin = this.renderSkinAsString(view);
    try {
        e4x = eval(skin);
    }
    catch(e) {}
    
    return e4x || skin || new XML();
}


/**
 * Provides the an array of the path breadcrumbs from
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
 * Resolver getters and setters
 */
Mocha.resolver = function(handle){
    // build resolver function
    var fnc = function() {
        
        // setup closure for current obj instance
        var obj = this;
    
        // define metaproperty handlers
        var resolver = {__metaobject__:{
        
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
                var next = obj;
                do {
                    // first check if we are looking for idempotent action methods
                    if (idempotentSuffix) {
                        // and then if their is an idempotent override
                        if (next.hasOwnProperty(prop.slice(0,prop.lastIndexOf('_')) +'_action_'+ idempotentSuffix)) {
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
                    if (obj.controls[prop])
                        property = obj.controls[prop].call(obj,property);
                    
                    // render the view to e4x if the control has not done so already
                    if (typeof property != 'xml')
                        property = obj.render(property);
                }
                else {
                    // first handle overrides for idempotent action methods
                    if (overrider && idempotentSuffix)
                        property = overrider[prop.slice(0,prop.lastIndexOf('_')) +'_action_'+ idempotentSuffix];
                        
                    // then overrides for macros, controls and standard actions
                    else if (overrider)
                        property = overrider[prop +'_'+ handle.slice(0,-1)];
                        
                    // then idempotent action methods inherited from the prototype chain
                    else if (idempotentSuffix)
                        property = obj[prop.slice(0,prop.lastIndexOf('_')) +'_action_'+ idempotentSuffix];
                    
                    // then macros, controls and standard actions methods inherited from the prototype chain
                    else 
                        property = obj[prop +'_'+ handle.slice(0,-1)];
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
                    obj[prop] = value;
                // or set views, controls and standard actions
                else
                    obj[prop +'_'+ handle.slice(0,-1)] = value;
            }
        }};
        
        // return object containing metaproperty handlers
        return resolver;
    }
    // return the built resolver function
    return fnc;
}


/**
 * Handles views object, resolving to appropriate getters and setters
 */
Mocha.prototype.__defineGetter__('views',Mocha.resolver('views'))


/**
 * Handles controls object, resolving to appropriate getters and setters
 */
Mocha.prototype.__defineGetter__('controls',Mocha.resolver('controls'))


/**
 * Handles actions object, resolving to appropriate getters and setters
 */
Mocha.prototype.__defineGetter__('actions',Mocha.resolver('actions'))


/**
 * Handles macros object, resolving to appropriate getters and setters
 */
Mocha.prototype.__defineGetter__('macros',Mocha.resolver('macros'))


/**
 * Handles access object, resolving to appropriate getters and setters
 */
Mocha.prototype.__defineGetter__('access',function() {
        
    // setup closure for current obj instance
    var obj = this;
    var userprefix = 'user_';

    // define metaproperty handlers
    var resolver = {__metaobject__:{
    
        // define getter for metaproperties
        get : function(thisObj,prop) {
            if (thisObj[prop])
                return thisObj[prop];
            
            if (!prop)
                return prop;
            
            var property, overrider;
            var groups = {};
            
            property = {
                
                /**
                 * Returns true if the user or group has this access right
                 */
                check : function(id,skip){
                    var result = 0;
                    var tag = id;
                    
                    // adds the user id prefix if the lookup is for a specific user
                    if (id instanceof User)
                        tag = userprefix + id._id;
                    // adds the user id prefix if the lookup is not for a group
                    else if (!id && session.user && session.user._id)
                        tag = userprefix + session.user._id;                        
                    else if (!id)
                        tag = 'unknown';
                    
                    // check for a specific access right for this user or group
                    
                    // first check for an overriding access right on the current obj
                    if (obj.hasOwnProperty('access_json') 
                            && obj.access_json.hasOwnProperty(prop) 
                            && obj.access_json[prop].hasOwnProperty(tag))
                        result = obj.access_json[prop][tag];
                    
                    // then check for overriding rights in the path chain
                    else if (obj._parent)
                        result = obj._parent.access[prop].check(id,'skip');
                    
                    if (!result && !skip) {
                    
                        // also check for an access right inherited from the prototype chain
                        if (obj.__proto__.access_json 
                                && obj.__proto__.access_json[prop] 
                                && obj.__proto__.access_json[prop][tag])
                            result = obj.__proto__.access_json[prop][tag];
                        
                        // and for an access right inherited from soft-coded group memberships
                        var next = obj;
                        do {
                            if (next.hasOwnProperty('access_json')) {
                                for (var group in next.access_json) {
                                    if (!group.startsWith(userprefix)) {
                                        
                                        // look for a group memberships
                                        if (next.access[prop].check(group,'skip')) {
                                            // and check access rights in that group
                                            result = next.access[group].check(id);
                                            
                                            // if we discover an exclude, it overrules an include
                                            if (result == -1)
                                                break;
                                        }
                                    }
                                }
                            }
                        }
                        while (next = next._parent && !result);
                        
                        // and finally for an access right inherited from prototype group memberships
                        if (!result) {
                            var next = obj;
                            do {
                                if (next.__proto__.access_json) {
                                    for (var group in next.__proto__.access_json) {
                                        if (!group.startsWith(userprefix)) {
                                            
                                            // look for a group memberships
                                            if (!groups[group] && next.__proto__.access[prop].check(group)) {
                                                // and check access rights in that group
                                                result = next.__proto__.access[group].check(id);
                                                
                                                // if we discover an exclude, it overrules an include
                                                if (result == -1)
                                                    break;
                                            }
                                            groups[group] = true;
                                        }
                                    }
                                }
                            }
                            while (next = next._parent && !result);
                        }
                        
                        if (!result && tag.startsWith(userprefix))
                            result = obj.access[prop].check('registered');
                    }
                    
                    return skip ? result : (result == 1) ? true : false;
                },
                
                /**
                 * Includes the user or group for this access right
                 */
                include : function(id){
                    if (id instanceof User)
                        id = userprefix + id._id;
                    else if (!id && session.user && session.user._id)
                        id = userprefix + session.user._id;
                    if (!id)
                        return false;
                    if (!obj.hasOwnProperty('access_json'))
                        obj.access_json = {};
                    if (!obj.access_json[prop])
                        obj.access_json[prop] = {};
                    obj.access_json[prop][id] = 1;
                    obj.persist();
                    return true;
                },
                
                /**
                 * Excludes the user or group from this access right
                 */
                exclude : function(id){
                    if (id instanceof User)
                        id = userprefix + id._id;
                    else if (!id && session.user && session.user._id)
                        id = userprefix + session.user._id;
                    if (!id)
                        return false;
                    if (!obj.hasOwnProperty('access_json'))
                        obj.access_json = {};
                    if (!obj.access_json[prop])
                        obj.access_json[prop] = {};
                    obj.access_json[prop][id] = -1;
                    obj.persist();
                    return true;
                },
                
                /**
                 * Removes the user or group from this access right
                 */
                remove : function(id){
                    if (id instanceof User)
                        id = userprefix + id._id;
                    else if (!id && session.user && session.user._id)
                        id = userprefix + session.user._id;
                    if (!id)
                        return false;
                    if (!obj.hasOwnProperty('access_json')
                            || !obj.access_json[prop]
                            || !obj.access_json[prop][id])
                        return false;
                    delete obj.access_json[prop][id];
                    obj.persist();
                    return true;
                }
            };
            
            // return the resolved property
            return property;
        }
            
    }};
    
    // return object containing metaproperty handlers
    return resolver;
});


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

