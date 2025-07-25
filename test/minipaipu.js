const assert = require('assert');

const Player  = require('../lib/player');
const Majiang = require('@kobalab/majiang-core');

const minipaipu = require('../lib/minipaipu');

function baseinfo(basestr = '') {

    let xun, param = basestr.split(/\//);
    if (param[param.length - 1][0] == '+' ) xun = param.pop();
    let [ paistr, zhuangfeng, menfeng, baopai, hongpai ] = param;

    zhuangfeng = +zhuangfeng||0;
    menfeng    = +menfeng||0;
    baopai     = (baopai||'z1').split(/,/);
    hongpai    = ! hongpai;
    xun        = +xun||0;

    return { paistr: paistr, zhuangfeng: zhuangfeng, menfeng: menfeng,
             baopai: baopai, hongpai: hongpai, xun: xun };
}

function heinfo(hestr = '') {
    return hestr.split(/\//);
}

suite('minipaipu', ()=>{
    test('モジュールが存在すること', ()=> assert.ok(minipaipu));

    suite('baseinfo', ()=>{
        const player = new Player();
        test('player.shoupai が設定されること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z2,z111='));
            assert.equal(player.shoupai.toString(), 'm123p456s6789z2,z111=');
        });
        test('player.model.zhuangfeng が設定されること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z2,z111=/1'));
            assert.equal(player.model.zhuangfeng, 1)
        });
        test('player.model.jushu が設定されること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z2,z111=//3'));
            assert.equal(player.model.jushu, 1)
        });
        test('player.shan.baopai が設定されること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z2,z111=///m1,p0'));
            assert.deepEqual(player.shan.baopai, ['m1','p0']);
        });
        test('赤牌なしルールが指定できること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z2,z111=////1'));
            assert.equal(player._suanpai._paishu.m[0], 0);
            assert.equal(player._suanpai._paishu.p[0], 0);
            assert.equal(player._suanpai._paishu.s[0], 0);
        });
        test('巡目が指定できること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z2,z111=//1/+5'));
            assert.equal(player.shan.paishu, 52);
        });
        test('牌姿に空文字列が指定できること', ()=>{
            minipaipu(player, baseinfo());
            assert.equal(player.shoupai.toString(), '_____________');
        });
        test('牌数が正しくカウントされること', ()=>{
            minipaipu(player, baseinfo('m123p406s6789z2,z111=///m0'));
            assert.deepEqual(player._suanpai._paishu,
                             { m: [0,3,3,3,4,3,4,4,4,4],
                               p: [0,4,4,4,3,3,3,4,4,4],
                               s: [1,4,4,4,4,4,3,3,3,3],
                               z: [0,1,3,4,4,4,4,4]     });
        });
    });

    suite('heinfo', ()=>{
        const player = new Player();
        test('多牌にならないこと', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z111z2'),
                      heinfo('z1///'));
            assert.ok(player.shoupai.get_dapai());
        });
        test('巡目を無視すること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z111z2/+5'), []);
            assert.equal(player.shan.paishu, 69);
        });
        test('河が正しく作られること', ()=>{
            minipaipu(player, baseinfo('m237p13099s135z44m9/0/0/p4'),
                      heinfo('z3s9/z2_s1_/p1m3/s9z7'));
            assert.deepEqual(player.model.he[1]._pai, ['z2_','s1_']);
        });
        test('牌数が正しくカウントされること', ()=>{
            minipaipu(player, baseinfo('m237p13099s135z44m9/0/0/p4'),
                      heinfo('z3s9/z2_s1_/p1m3/s9z7'));
            assert.deepEqual(player._suanpai._paishu,
                             { m: [1,4,3,2,4,4,4,3,4,3],
                               p: [0,2,4,3,3,3,4,4,4,2],
                               s: [1,2,4,3,4,3,4,4,4,2],
                               z: [0,4,3,3,2,4,4,3]     });
            assert.equal(player.shan.paishu, 61);
        });
        test('リーチの現物を把握できること', ()=>{
            minipaipu(player, baseinfo('m349p23368s33788s7/0/3/z5'),
                      heinfo('z7z4/z3s8z6*/z6z5z2/z3z4z2'));
            assert.deepEqual(Object.keys(player._suanpai._dapai[0]).sort(),
                             ['s8','z2','z3','z6']);
        });
        test('飛ばしたツモもカウントすること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z111z2'),
                      heinfo('///z3'));
            assert.equal(player.shan.paishu, 65);
        });
        test('副露を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123p456s6789z111'),
                               heinfo('/z3,m456-//'));
            assert.deepEqual(player.model.he[0]._pai, ['m6-']);
            assert.deepEqual(player.model.shoupai[1]._fulou, ['m456-']);
            assert.equal(player.model.shoupai[1]._bingpai._, 10);
            assert.deepEqual(player.model.he[1]._pai, ['z3']);
            assert.equal(player.shan.paishu, 69);
            assert.deepEqual(rv, ['m6-','z3,m456-','','']);
        });
        test('自身の副露を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123s6789z111,p550=//2'),
                               heinfo('z3///'));
            assert.deepEqual(player.model.he[0]._pai, ['p0=']);
            assert.equal(player._suanpai._paishu.p[5], 1);
            assert.equal(player._suanpai._paishu.p[0], 0);
            assert.deepEqual(player.he._pai, ['z3']);
            assert.equal(player.shan.paishu, 69);
            assert.deepEqual(rv, ['z3','','p0=','']);
        });
        test('副露のタイミングを指定できること', ()=>{
            let rv = minipaipu(player, baseinfo('m123p456s6789z111'),
                               heinfo('z7m6-/z3z4,m456-//'));
            assert.deepEqual(player.model.he[0]._pai, ['z7','m6-']);
            assert.deepEqual(player.model.shoupai[1]._fulou, ['m456-']);
            assert.equal(player.model.shoupai[1]._bingpai._, 10);
            assert.deepEqual(player.model.he[1]._pai, ['z3','z4']);
            assert.deepEqual(rv, ['z7m6-','z3z4,m456-','','']);
        });
        test('複数の副露の順序を正しく処理すること', ()=>{
            minipaipu(player, baseinfo('m35p23678s207789s8/0/0/s1'),
                      heinfo('z6z7/z3z4//z1z2,m123-,m3-45'));
            assert.deepEqual(player.model.shoupai[3]._fulou, ['m123-','m3-45']);
            minipaipu(player, baseinfo('m35p23678s207789s8/0/0/s1'),
                      heinfo('z6z7/z3z4/p3-/z1z2,p23-4,p3-45'));
            assert.deepEqual(player.model.shoupai[3]._fulou, ['p23-4','p3-45']);
            minipaipu(player, baseinfo('m35p23678s207789s8/0/0/s1'),
                      heinfo('z6z7/z3z4/s3-s3-/z1z2,s3-45,s123-'));
            assert.deepEqual(player.model.shoupai[3]._fulou, ['s3-45','s123-']);
        });
        test('大明槓を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123p456s6789z111'),
                               heinfo('/z3,m4444-//'));
            assert.deepEqual(player.model.he[0]._pai, ['m4-']);
            assert.deepEqual(player.model.shoupai[1]._fulou, ['m4444-']);
            assert.equal(player.model.shoupai[1]._bingpai._, 10);
            assert.deepEqual(player.model.he[1]._pai, ['z3']);
            assert.equal(player.shan.paishu, 68);
            assert.deepEqual(rv, ['m4-','z3,m4444-','','']);
        });
        test('自身の大明槓を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123s6789z111,p5550=//2'),
                               heinfo('z3///'));
            assert.deepEqual(player.model.he[0]._pai, ['p0=']);
            assert.equal(player._suanpai._paishu.p[5], 0);
            assert.equal(player._suanpai._paishu.p[0], 0);
            assert.deepEqual(player.he._pai, ['z3']);
            assert.equal(player.shan.paishu, 68);
            assert.deepEqual(rv, ['z3','','p0=','']);
        });
        test('暗槓を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123p456s6789z111//3'),
                               heinfo('/z3,m4444//'));
            assert.deepEqual(player.model.shoupai[0]._fulou, ['m4444']);
            assert.equal(player.model.shoupai[0]._bingpai._, 10);
            assert.deepEqual(player.model.he[0]._pai, ['z3']);
            assert.equal(player.shan.paishu, 68);
            assert.deepEqual(rv, ['','m4^z3,m4444','','']);
        });
        test('自身の暗槓を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123s6789z111,p5550//0'),
                               heinfo('z3///'));
            assert.equal(player._suanpai._paishu.p[5], 0);
            assert.equal(player._suanpai._paishu.p[0], 0);
            assert.deepEqual(player.he._pai, ['z3']);
            assert.equal(player.shan.paishu, 68);
            assert.deepEqual(rv, ['p5^z3','','','']);
        });
        test('暗槓のタイミングを指定できること', ()=>{
            let rv = minipaipu(player, baseinfo('m123p456s6789z111//3'),
                               heinfo('/m4^z3,m4444//'));
            assert.deepEqual(player.model.shoupai[0]._fulou, ['m4444']);
            assert.equal(player.model.shoupai[0]._bingpai._, 10);
            assert.deepEqual(player.model.he[0]._pai, ['z3']);
            assert.equal(player.shan.paishu, 68);
            assert.deepEqual(rv, ['','m4^z3,m4444','','']);
        });
        test('加槓を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123p456s6789z111//3'),
                               heinfo('///z3z4,m444=4'));
            assert.deepEqual(player.model.he[0]._pai, ['m4=']);
            assert.deepEqual(player.model.shoupai[2]._fulou, ['m444=4']);
            assert.equal(player.model.shoupai[2]._bingpai._, 10);
            assert.deepEqual(player.model.he[2]._pai, ['z3','z4']);
            assert.equal(player.shan.paishu, 64);
            assert.deepEqual(rv, ['','m4=','','z3m4^z4,m444=4']);
        });
        test('自身の加槓を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123s6789z111,p555+0//3'),
                               heinfo('z3z4///'));
            assert.deepEqual(player.model.he[0]._pai, ['p5+']);
            assert.equal(player._suanpai._paishu.p[5], 0);
            assert.equal(player._suanpai._paishu.p[0], 0);
            assert.deepEqual(player.he._pai, ['z3','z4']);
            assert.equal(player.shan.paishu, 64);
            assert.deepEqual(rv, ['z3p0^z4','p5+','','']);
        });
        test('加槓のタイミングを指定できること', ()=>{
            let rv = minipaipu(player, baseinfo('m123p456s6789z111//3'),
                               heinfo('///z3m4^z4,m444=4'));
            assert.deepEqual(player.model.he[0]._pai, ['m4=']);
            assert.deepEqual(player.model.shoupai[2]._fulou, ['m444=4']);
            assert.equal(player.model.shoupai[2]._bingpai._, 10);
            assert.deepEqual(player.model.he[2]._pai, ['z3','z4']);
            assert.equal(player.shan.paishu, 64);
            assert.deepEqual(rv, ['','m4=','','z3m4^z4,m444=4']);
        });
        test('複数の加槓を正しく処理すること', ()=>{
            let rv = minipaipu(player, baseinfo('m123p456s6789z111//3'),
                               heinfo('//,m444-4,s444+4/'));
            assert.deepEqual(player.model.he[0]._pai, ['m4-']);
            assert.deepEqual(player.model.he[2]._pai, ['s4+']);
            assert.deepEqual(player.model.shoupai[1]._fulou,
                                                    ['m444-4','s444+4']);
            assert.equal(player.model.shoupai[1]._bingpai._, 7);
            assert.deepEqual(player.model.he[1]._pai, []);
            assert.equal(player.shan.paishu, 63);
            assert.deepEqual(rv, ['','m4-','s4^m4^,m444-4,s444+4','s4+']);
        });
    });

    suite('異常系', ()=>{
        const player = new Player();
        test('不正なドラを処理しないこと', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z111///z1,z0,z2'));
            assert.deepEqual(player.model.shan.baopai, ['z1','z2']);
        });
        test('不正な河を処理しないこと', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z111'),
                      heinfo('z1_az2*///'));
            assert.deepEqual(player.he._pai, ['z1_','z2*']);
        });
        test('副露牌を正規形に変換すること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z111'),
                      heinfo('/,m3-12//'));
            assert.deepEqual(player.model.shoupai[1]._fulou, ['m123-']);
        });
        test('不正な副露牌を処理しないこと', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z111'),
                      heinfo('/,z110+//'));
            assert.deepEqual(player.model.shoupai[1]._fulou, []);
        });
        test('副露の順序を訂正できること', ()=>{
            minipaipu(player, baseinfo('m123p456s6789z111'),
                      heinfo('///,m6-45,s222='), true);
            assert.deepEqual(player.model.he[1]._pai, ['s2=']);
            assert.deepEqual(player.model.he[2]._pai, ['m6-']);
            assert.deepEqual(player.model.shoupai[3]._fulou, ['m456-','s222=']);
        });
    });

    suite('後方互換性', ()=>{
        test('0400以降のAIで使用可能なこと', ()=>{
            const Player = require('../legacy/player-0400');
            const player = new Player();
            minipaipu(player, baseinfo('m349p23368s33788s7/0/3/z5'),
                      heinfo('z7z4/z3s8z6*/z6z5z2/z3z4z2'));
            assert.deepEqual(Object.keys(player._suanpai._dapai[0]).sort(),
                             ['s8','z2','z3','z6']);
        });
    });
});
