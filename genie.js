function Input(elem) {
    this.elem = elem;
}
Input.prototype = new (function() {
    this.listen = function(cb) {
        const _self = this;
        const elem = this.elem;
        elem.addEventListener('input', () => cb(parseInt(elem.value, 16)));
    };
});

function Genie(addrF, dataF, cmpF, out) {
    this.addr = this.register(new Input(addrF), "1dEfBcDe");
    this.data = this.register(new Input(dataF), "AbHa");
    this.cmp  = this.register(new Input(cmpF), "GhFg");
    this.out = out;
    this.value = 0x00800000; // For the hard-coded "on" high bit of addr

    this.sanityCheckRegistry();
}
Genie.prototype = new (function() {
    this.register = function(input, mapping){
        const _self = this;
        this.registerMapping(mapping);
        input.listen((value) => _self.recv(value, mapping));
        return input;
    };
    this.registerMapping = function(mapping){
        let reg = this.maybeInitMappingRegistry();
        let i = 0;
        for (let item of mapping) {
            if (!(item in reg)) {
                throw `Unrecognized mapping ${item}`;
            }
            if (item != '1'
                    && ( (item == item.toUpperCase()) != ((i % 2) == 0) )) {
                throw `'${item}' of '${mapping}' is out of place!`;
            }
            ++reg[item];
            ++i;
        }
    };
    const mapstr = "abcdefgh";
    this.maybeInitMappingRegistry = function(){
        if (this.mappingReg === undefined) {
            this.mappingReg = {};
            for (let c_ of mapstr) {
                for (let c of [c_.toUpperCase(), c_.toLowerCase()]) {
                    if (c == 'C') c = '1';
                    this.mappingReg[c] = 0;
                }
            }
        }
        return this.mappingReg;
    };
    this.sanityCheckRegistry = function(){
        for (m in this.mappingReg) {
            if (this.mappingReg[m] == 0) {
                throw `No mappings for ${m}!`;
            }
            else if (this.mappingReg[m] > 1) {
                throw `Multiple mappings (${this.mappingReg[m]}) for ${m}!`;
            }
        }
    };
    this.recv = function(value, mapping){
        this.adjustValue(value, mapping);
        this.output();
    }
    this.adjustValue = function(value, mapping) {
        let i=0;
        for (m of mapping) {
           if (m == '1') continue;
           let baseMask = (m == m.toUpperCase())? 8: 7;
           let srcWhere = 4 * (Math.floor(mapping.length / 2) - 1 - (i - (i%2)));
           let dstWhere = 28 - (m.toUpperCase().charCodeAt(0) - 0x41 /* A */) * 4;

           this.value = (this.value & ~(baseMask << dstWhere))
                | (((value & (baseMask << srcWhere)) >> srcWhere) << dstWhere);
           ++i;
        }
    };
    this.output = function() {
        let t = this.transliterate(this.value);
        this.out.innerText = t;
    }
    const transLookup = "APZLGITYEOXUKSVN";
    this.transliterate = function(value) {
        let ret = "";
        for (let i=28; i>=0; i-=4) {
            ret += transLookup[ (this.value >> i) & 0xF ];
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