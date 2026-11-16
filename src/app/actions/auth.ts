'use server';
import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { ForgotPasswordSchema, UpdatePasswordSchema } from '@/lib/schemas/auth';
import { signIn } from '@/lib/auth/sign-in';
import { checkRateLimit, AUTH_LOGIN_RATE_LIMIT } from '@/lib/security/rate-limiter';

export interface AuthActionResult {
  success:boolean;
  message?:string;
  fieldErrors?:Record<string,string[]>;
  redirectTo?:string;
}
export async function login(formData:FormData):Promise<AuthActionResult> {
  const h=await headers();
  const rate=await checkRateLimit(h.get('x-real-ip')||'unknown',AUTH_LOGIN_RATE_LIMIT);
  if(!rate.allowed)return {success:false,message:AUTH_LOGIN_RATE_LIMIT.errorMessage};
  let destination:string;
  try {
    const result=await signIn({email:formData.get('email'),password:formData.get('password')});
    destination=result.redirectTo;
  }catch{return {success:false,message:'E-mail ou senha incorretos.'};}
  redirect(destination);
}
export async function logout():Promise<void>{
  await auth.signOut();
  redirect('/login');
}
export async function requestPasswordReset(formData:FormData):Promise<AuthActionResult>{
  const parsed=ForgotPasswordSchema.safeParse({email:String(formData.get('email')||'')});
  if(!parsed.success)return {success:false,message:'Informe um e-mail válido.',fieldErrors:parsed.error.flatten().fieldErrors};
  const canonical=process.env.NEXT_PUBLIC_APP_URL || 'https://tag.konnexy.com.br';
  try {
    await auth.requestPasswordReset({email:parsed.data.email,redirectTo:canonical+'/reset-password'});
  }catch{
    return {success:false,message:'Serviço de recuperação temporariamente indisponível.'};
  }
  return {success:true,message:'Se o e-mail estiver cadastrado, enviaremos o link de recuperação.'};
}
export async function updatePassword(formData:FormData):Promise<AuthActionResult>{
  const parsed=UpdatePasswordSchema.safeParse({
    password:String(formData.get('password')||''),
    confirmPassword:String(formData.get('confirmPassword')||'')
  });
  if(!parsed.success)return {success:false,message:'Senha fora dos critérios de segurança.'};
  const token=String(formData.get('token')||'');
  if(!token)return {success:false,message:'Link inválido. Solicite uma nova recuperação de senha.'};
  try {
    const response=await auth.resetPassword({token,newPassword:parsed.data.password});
    if(response.error)return {success:false,message:'Link expirado ou inválido. Solicite outro.'};
  }catch{return {success:false,message:'Não foi possível redefinir a senha.'};}
  return {success:true,message:'Senha redefinida.',redirectTo:'/login'};
}
