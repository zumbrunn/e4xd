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
 * Resolver getters and setters
 */
Mocha.resolver = function(handle){
    // build resolver function
    var fnc = function() {
        
        // setup closure for current obj instance
        var obj = this;
    
        // define metaproperty handlers
        var resolver = {
        
            // define getter for metaproperties
            __get__ : function(prop) {

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
                        try {
                            property = obj.controls[prop].call(obj,property);
                        }
                        catch(e) {
                            property = <span class="failedView" style="visibility:hidden">
                                Failed view {property +': '+ e}
                                <script>
                                    if (window.console)
                                        console.log('Failed view {property+': '+e}')
                                </script>
                            </span>;
                        }
                    
                    // render the view to e4x if the control has not done so already
                    if (typeof property != 'xml')
                        property = obj.render(property);
                    
                    // attempt to add debug attribute
                    try {
                        if (app.properties.debug && property.nodeKind() == 'element')
                            property.@debugview = prop;
                    }
                    catch(e){}
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
                return property || obj[prop];
            },
                
            // define setter for metaproperties
            __put__ : function(prop,value) {
                
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
        };
        
        // return object containing metaproperty handlers
        return new JSAdapter(resolver);
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
 * Handles fetchlets object, resolving to appropriate getters and setters
 */
Mocha.prototype.__defineGetter__('fetchlets',Mocha.resolver('fetchlets'))


/**
 * Handles access object, resolving to appropriate getters and setters
 */
Mocha.prototype.access = Mocha.prototype.__defineGetter__('access',function() {

    var obj = this;
    var userprefix = 'user_';
    var groups = {};
    
    // define metaproperty handlers
    var resolver = new JSAdapter(
    {
        // define getter for metaproperties
        __get__ : function(property) {
                
                if (this[property])
                    return this[property];
                
                if (!property)
                    return property;
                
                return this.check(property);
        },
        
        /**
         * Returns true if the user or group has the specified access right
         */
        check : function(prop,id,skip){

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
                result = obj._parent.access.check(prop,id,'skip');
            
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
                                if (next.access.check(prop,group,'skip')) {
                                    // and check access rights in that group
                                    result = next.access.check(group,id);
                                    
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
                                    if (!groups[group] && next.__proto__.access.check(prop,group)) {
                                        // and check access rights in that group
                                        result = next.__proto__.access.check(group,id);
                                        
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
                    result = obj.access.check(prop,'registered');
            }
            
            return skip ? result : (result == 1) ? true : false;
        },
        
        /**
         * Includes the user or group for the specified access right
         */
        include : function(prop,id){
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
         * Excludes the user or group from the specified access right
         */
        exclude : function(prop,id){
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
         * Clears the user or group from the specified access right
         */
        clear : function(prop,id){
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
    })
    
    // return object containing metaproperty handlers
    return resolver;
});


