function Input(elem) {
    this.elem = elem;
}
Input.prototype = new (function() {
    this.listen = function(cb) {
        const _self = this;
        const elem = this.elem;
        elem.addEventListener('input', () => cb(parseInt(elem.value, 16)));
        cb(parseInt(elem.value, 16));
    };
});

function Genie(addrF, dataF, cmpF, out) {
    this.out = out;
    this.addr = this.data = this.cmp = 0;
    this.value = 0x00800000; // For the hard-coded "on" high bit of addr
    this.register(new Input(addrF), 'addr');
    this.register(new Input(dataF), 'data');
    this.register(new Input(cmpF), 'cmp');
}
Genie.prototype = new (function() {
    this.register = function(input, mapping){
        const _self = this;
        input.listen((value) => _self.recv(value, mapping));
        return input;
    };
    this.recv = function(value, name) {
        this[name] = value;
        this.output();
    }
    let mapping = "1dEfBcDeAbHaGhFg";
    this.recalc = function() {
        let inval = ((this.addr & 0xFFFF) << 16) | ((this.data & 0xFF) << 8) | (this.cmp & 0xFF);
        let outval = 0x00800000;
        for (let i=0; i != mapping.length; ++i) {
           m = mapping[i];
           if (m == '1') continue;
           let baseMask = (m == m.toUpperCase())? 8: 7;
           let srcWhere = 4 * (Math.floor((mapping.length+1 - i) / 2) - 1);
           let dstWhere = 28 - (m.toUpperCase().charCodeAt(0) - 0x41 /* A */) * 4;

           let inMask = baseMask << srcWhere;
           let inGot  = (inval & inMask) >>> srcWhere;
           outval |= inGot << dstWhere;
        }
        this.value = outval;
    };
    this.output = function() {
        this.recalc();
        let t = this.transliterate(this.value);
        this.out.innerText = t;
    }
    const transLookup = "APZLGITYEOXUKSVN";
    this.transliterate = function(value) {
        let ret = "";
        for (let i=28; i>=0; i-=4) {
            ret += transLookup[ (value >> i) & 0xF ];
        }

        return ret;
    }
});

function init() {
    const addr = document.getElementById('addr');
    const data = document.getElementById('data');
    const cmp  = document.getElementById('cmp');
    const out  = document.getElementById('output');

    new Genie(addr, data, cmp, out);
}

addEventListener("load", init);