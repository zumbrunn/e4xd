/**
 *  e4xd javascript server-side - openmocha reduced to the max
 * 
 *  Copyright 2008 Chris Zumbrunn <chris@zumbrunn.com> http://zumbrunn.com
 *  version 0.9, March 3, 2008
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

    // workaround for a bug that causes onInit not to be called when
    // the root objects is re-fetched from the database
    // http://helma.org/bugs/show_bug.cgi?id=598
    if (!root.hasOwnProperty('access_json'))
        root.onInit();

    // sets the actually resolved action, as it is also set by notfound
    req.data.action = req.action;
    
    if (req.action != 'notfound') {
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
    
    res.status = 200;
    
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
    
    // render auto-action-enabled views 
    else if (obj.actionviews_json 
            && obj.actionviews_json[req.data.action] 
            && obj.access[req.data.action])
        obj.renderPage();
    
    // if the main action was denied, redirect to the login
    else if (req.data.action == 'main')
        res.redirect(obj.href('login'));
    
    // otherwise redirect to the main action
    else 
        res.redirect(obj.href());
}


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
            || i.endsWith('_macro')
            || i.endsWith('_fetchlet')
            || i.endsWith('_control'))
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
            || i.endsWith('_macro_')
            || i.endsWith('_fetchlet_')
            || i.endsWith('_control_'))
            this[i.slice(0,-1)] = new Function(this[i]);
    }
}
