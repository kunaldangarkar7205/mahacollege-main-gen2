// MahaCollege - account-scoped favorites and prediction history
// Uses Supabase when the tables exist; safely falls back to per-account local storage.
(function(){
  async function currentUser(){
    if(!window.supabaseClient) return null;
    const {data,error}=await window.supabaseClient.auth.getUser();
    if(error) throw error;
    return data.user || null;
  }
  function key(prefix,user){ return `mahacollege_${prefix}_${user?.id || 'guest'}`; }
  function read(prefix,user,def=[]){ try { return JSON.parse(localStorage.getItem(key(prefix,user)) || JSON.stringify(def)); } catch(e){ return def; } }
  function write(prefix,user,value){ try { localStorage.setItem(key(prefix,user),JSON.stringify(value)); } catch(e){} }
  async function supaGet(table, query){
    try { return await query; } catch(e){ return {data:null,error:e}; }
  }

  window.MahaAccount = {
    async getUser(){ return currentUser(); },
    async getFavorites(){
      const user=await currentUser(); if(!user) return [];
      const r=await supaGet('favorite_colleges', window.supabaseClient.from('favorite_colleges').select('college_id').eq('user_id',user.id).order('created_at',{ascending:true}));
      if(!r.error) return (r.data||[]).map(x=>String(x.college_id));
      return read('favorites',user,[]).map(String);
    },
    async toggleFavorite(collegeId){
      const user=await currentUser(); if(!user) throw new Error('Please log in first.');
      const id=String(collegeId);
      const r=await supaGet('favorite_colleges', window.supabaseClient.from('favorite_colleges').select('id').eq('user_id',user.id).eq('college_id',id).maybeSingle());
      if(!r.error){
        if(r.data){ const d=await window.supabaseClient.from('favorite_colleges').delete().eq('id',r.data.id).eq('user_id',user.id); if(!d.error) return false; }
        else { const ins=await window.supabaseClient.from('favorite_colleges').insert({user_id:user.id,college_id:id}); if(!ins.error) return true; }
      }
      let f=read('favorites',user,[]).map(String); const i=f.indexOf(id);
      if(i>=0){f.splice(i,1);write('favorites',user,f);return false;}
      f.push(id);write('favorites',user,f);return true;
    },
    async removeFavorite(collegeId){
      const user=await currentUser(); if(!user) return; const id=String(collegeId);
      await window.supabaseClient.from('favorite_colleges').delete().eq('user_id',user.id).eq('college_id',id);
      write('favorites',user,read('favorites',user,[]).map(String).filter(x=>x!==id));
    },
    async clearFavorites(){
      const user=await currentUser(); if(!user) return;
      await window.supabaseClient.from('favorite_colleges').delete().eq('user_id',user.id);
      write('favorites',user,[]);
    },
    async getHistory(){
      const user=await currentUser(); if(!user) return [];
      const r=await supaGet('prediction_history', window.supabaseClient.from('prediction_history').select('id,percentile,category,branch,region,round,result_count,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50));
      if(!r.error) return r.data||[];
      return read('prediction_history',user,[]);
    },
    async addPrediction(item){
      const user=await currentUser(); if(!user) throw new Error('Please log in first.');
      const row={user_id:user.id,percentile:Number(item.percentile),category:item.category||'All Categories',branch:item.branch||'All Branches',region:item.region||'All Regions',round:item.round||'All Rounds',result_count:Number(item.count)||0};
      const r=await window.supabaseClient.from('prediction_history').insert(row);
      if(r.error){ const h=read('prediction_history',user,[]); h.unshift({...row,id:`local-${Date.now()}`,created_at:new Date().toISOString()}); write('prediction_history',user,h.slice(0,50)); }
    },
    async clearHistory(){
      const user=await currentUser(); if(!user) return;
      await window.supabaseClient.from('prediction_history').delete().eq('user_id',user.id);
      write('prediction_history',user,[]);
    }
  };
})();
