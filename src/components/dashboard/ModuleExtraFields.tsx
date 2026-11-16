'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { uploadTenantImage } from '@/lib/managed-client';
import { compressLogoToBlob } from '@/lib/images';
import type { TenantModule, CatalogItem } from '@/types/phygital';

interface Props {
  module: TenantModule;
  tenantId: string;
  onChange: (config: Record<string, any>) => void;
}
const cls='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100';
function Field({label,value,onChange,placeholder,type='text'}: {
  label:string;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string;
}) {
  return <label className="block space-y-1"><span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{label}</span>
    <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} className={cls}/></label>;
}
export function ModuleExtraFields({module,tenantId,onChange}:Props){
  const c=module.config_data || {};
  const [uploading,setUploading]=useState<string|null>(null);
  const set=(k:string,v:unknown)=>onChange({...c,[k]:v});
  const upload=async (id:string,file?:File)=>{
    if(!file)return;
    setUploading(id);
    try {
      const blob=await compressLogoToBlob(file);
      const url=await uploadTenantImage(tenantId,blob);
      const items:CatalogItem[]=[...(c.items||[])];
      set('items',items.map(item=>item.id===id?{...item,image_url:url}:item));
      toast.success('Imagem preparada. Salve o módulo para publicar.');
    } catch(e) {toast.error(e instanceof Error?e.message:'Falha ao enviar imagem.');}
    finally {setUploading(null);}
  };
  switch(module.module_type){
    case 'pix_facil':return <div className="grid sm:grid-cols-2 gap-3">
      <label className="block space-y-1"><span className="text-xs font-semibold">Tipo de chave Pix</span>
        <select value={c.pix_key_type||'evp'} onChange={e=>set('pix_key_type',e.target.value)} className={cls}>
          <option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option>
          <option value="phone">Telefone</option><option value="evp">Aleatória (EVP)</option>
        </select></label>
      <Field label="Cidade (ex.: SAO PAULO)" value={c.city||''} onChange={v=>set('city',v)} />
      <p className="sm:col-span-2 text-xs text-zinc-500">O QR Pix estático não confirma pagamentos. Confira a chave, o favorecido e a cidade antes de publicar.</p>
    </div>;
    case 'wifi_facil':return <div className="space-y-2">
      <label className="block space-y-1"><span className="text-xs font-semibold">Segurança da rede de convidados</span>
        <select value={c.encryption||'WPA'} onChange={e=>set('encryption',e.target.value)} className={cls}>
          <option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">Rede aberta</option>
        </select></label>
      <p className="text-xs text-amber-700 dark:text-amber-300">Use somente uma rede separada de convidados. O QR contém a senha em texto codificado e pode ser lido por qualquer visitante.</p>
    </div>;
    case 'cardapio_link':return <div className="grid gap-3">
      <Field label="URL HTTPS do PDF ou cardápio" value={c.url||''} placeholder="https://..." onChange={v=>set('url',v)}/>
      <Field label="Texto do botão" value={c.button_label||''} onChange={v=>set('button_label',v)}/>
      <label className="block space-y-1"><span className="text-xs font-semibold">Tipo de destino</span>
        <select value={c.mode||'external'} onChange={e=>set('mode',e.target.value)} className={cls}>
          <option value="external">Cardápio ou site externo</option><option value="pdf">Documento PDF</option>
        </select></label>
    </div>;
    case 'catalogo_produtos':{
      const items:CatalogItem[]=c.items||[];
      const changeItem=(id:string,k:keyof CatalogItem,v:string)=>set('items',items.map(i=>i.id===id?{...i,[k]:v}:i));
      return <div className="space-y-3">
        <div className="flex justify-between items-center"><p className="text-xs text-zinc-500">{items.length} de 50 itens</p>
          <button type="button" disabled={items.length>=50}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            onClick={()=>set('items',[...items,{id:crypto.randomUUID(),title:'Novo produto',description:'',price:'',image_url:'',badge:''}])}>Adicionar produto</button>
        </div>
        {items.map((i,index)=><div key={i.id} className="space-y-2 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="flex items-center justify-between">
            <strong className="text-xs">Item {index+1}</strong>
            <button type="button" className="text-xs text-rose-500" onClick={()=>set('items',items.filter(item=>item.id!==i.id))}>Excluir</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="Nome" value={i.title} onChange={v=>changeItem(i.id,'title',v)}/>
            <Field label="Preço (ex.: R$ 29,90)" value={i.price} onChange={v=>changeItem(i.id,'price',v)}/>
          </div>
          <Field label="Descrição" value={i.description||''} onChange={v=>changeItem(i.id,'description',v)}/>
          <Field label="Selo promocional" value={i.badge||''} onChange={v=>changeItem(i.id,'badge',v)}/>
          {i.image_url&&<img src={i.image_url} alt="" className="h-20 w-20 rounded-lg object-cover"/>}
          <label className="inline-flex cursor-pointer rounded-lg border px-3 py-2 text-xs">
            {uploading===i.id?'Enviando...':'Enviar foto do produto'}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!uploading}
              onChange={e=>{void upload(i.id,e.target.files?.[0]);e.target.value='';}} className="hidden"/>
          </label>
        </div>)}
      </div>;
    }
    case 'social_links':return <div className="grid sm:grid-cols-2 gap-3">
      <Field label="Facebook (URL HTTPS)" value={c.facebook||''} onChange={v=>set('facebook',v)}/>
      <Field label="YouTube (URL HTTPS)" value={c.youtube||''} onChange={v=>set('youtube',v)}/>
      <p className="sm:col-span-2 text-xs text-zinc-500">A micro-página exibirá somente as redes sociais que tiverem links cadastrados.</p>
    </div>;
    case 'site_institucional':
    case 'custom_link':return <div className="grid gap-3">
      <Field label="URL HTTPS de destino" value={c.url||''} placeholder="https://..." onChange={v=>set('url',v)}/>
      <Field label="Título do botão" value={c.label||''} onChange={v=>set('label',v)}/>
      <Field label="Subtítulo" value={c.subtitle||''} onChange={v=>set('subtitle',v)}/>
    </div>;
    default:return null;
  }
}
