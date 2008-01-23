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


