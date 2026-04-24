import 'dotenv/config';
import { createOccurrence } from '../db';

(async function(){
  try{
    const res = await createOccurrence({
      userId: 1,
      type: 'fire' as any,
      latitude: -23.55 as any,
      longitude: -46.63 as any,
      description: 'Teste de criação direta via script',
      severity: 'medium' as any,
      physicalParameters: null,
    });
    console.log('createOccurrence result:', res);
  }catch(e){
    console.error('error:', e);
    process.exit(1);
  }
})();
