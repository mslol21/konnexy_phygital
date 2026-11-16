import type { PixFacilConfig } from '@/types/phygital';
function item(id:string,value:string):string {
  const len=new TextEncoder().encode(value).length;
  if(len>99)throw new Error('Campo Pix muito longo.');
  return id+String(len).padStart(2,'0')+value;
}
function normalize(value:string,max:number):string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9 .-]/g,' ').trim().toUpperCase().slice(0,max);
}
/** Static BR Code / EMV, no amount. Must not be interpreted as payment confirmation. */
export function staticPixPayload(cfg:PixFacilConfig):string {
  const key=cfg.pix_key.trim();
  if(!key||new TextEncoder().encode(key).length>77)throw Error('Chave Pix inválida.');
  const name=normalize(cfg.beneficiary_name||'RECEBEDOR',25)||'RECEBEDOR';
  const city=normalize(cfg.city||'SAO PAULO',15)||'SAO PAULO';
  const merchant=item('00','br.gov.bcb.pix')+item('01',key);
  const data=item('00','01')+item('26',merchant)+item('52','0000')+
    item('53','986')+item('58','BR')+item('59',name)+item('60',city)+
    item('62',item('05','***'))+'6304';
  let crc=0xffff;
  for(const char of new TextEncoder().encode(data)){
    crc^=char<<8;
    for(let j=0;j<8;j++)crc=crc&0x8000?((crc<<1)^0x1021)&0xffff:(crc<<1)&0xffff;
  }
  return data+crc.toString(16).toUpperCase().padStart(4,'0');
}
