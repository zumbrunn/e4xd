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
 * Returns the collection of fetchlets from the prototype chain
 */
function collectFetchlets() {
    
    // collect fetchlets from prototype chain
    var protoChain = this;
    var fetchletCollection = [];
    do {
        if (protoChain._fetchlets)
            for (var fetchlet in protoChain._fetchlets)
                if (!fetchletCollection.contains(protoChain._fetchlets[fetchlet]))
                    fetchletCollection.push(protoChain._fetchlets[fetchlet]);
    } 
    while ((protoChain = protoChain.__proto__) != Object.prototype);
    
    // collect fetchlets from the path chain
    var pathCollection = [];
    var pathChain = this;
    do {
        for (var prop in pathChain)
            if (prop.endsWith('_fetchlet')) {
                var fetchlet = prop.slice(0,-9);
                if (fetchletCollection.contains(fetchlet))
                    fetchletCollection.splice(fetchletCollection.indexOf(fetchlet),1);
                pathCollection.push(fetchlet);
            }
    }
    while (pathChain = pathChain._parent);
    
    // combine fetchlet collections from prototype and path chain
    fetchletCollection  = fetchletCollection.reverse().concat(pathCollection.reverse());
    
    return fetchletCollection;
}


/**
 * Builds a collection of fetchlets for injection on the client-side
 */
function buildFetchlets() {
    var fetchlets = '';
    var fetchletCollection = this.collectFetchlets();
    
    var fetch = 'fetcher({fetchlet:"\'+fetchid+\'"})';
    
    // define client-side fetchlet functions
    for (var fetchletName in fetchletCollection) {
        
        // handle hierarchical fetchlets
        if (fetchletCollection[fetchletName].contains('_')) {
            var objtree = fetchletCollection[fetchletName].split('_');
            var prop = objtree.pop();
            var base = objtree.shift();
            
            // first make sure the object tree exists
            fetchlets += 'if (!window.'+ base +') var '+ base +' = {};\n';
            for (var obj in objtree) {
                fetchlets += 'if (!'+ base +'.'+ objtree[obj] +') '+ base +'.'+ objtree[obj] +' = {};\n';
                base = base + '.'+ objtree[obj];
            }
            
            // define hierarchical fetchlet
            fetchlets += base +'.'+ prop +' = '
                + 'function(params){fetcher("'+ base +'.'+ prop +'", params)};\n';
        }
        
        // define plain, non-hierarchical fetchlet
        else
            fetchlets += 'var '+ fetchletCollection[fetchletName] +' = '
                + 'function(params){fetcher("'+ fetchletCollection[fetchletName] +'", params)};\n';
    }
    
    var fetcher = function(fetchid,params) {
            
            // prepare params
            params = params ? '&params='+ encodeURIComponent(params) : '';
            
            var element = document.createElement('script');
            element.setAttribute('src', '<% this.href %>fetch?fetchlet='+fetchid
                +'&r'+Math.random().toString().slice(2)+'=0'+params);
            document.getElementsByTagName("head")[0].appendChild(element);
    }
    
    if (fetchlets)
        fetchlets = 'var fetcher = '+ this.render(fetcher) +';\n'+ fetchlets;
    
    return fetchlets;
}


/**
 * Renders a script for sending to the client
 */
function sendScript(script) {
    var value = this.renderSkinAsString(script);
    if (!value)
        value = script;
    value = value.replace('<script>','').replace('</script>','');
    res.write(value);
}


