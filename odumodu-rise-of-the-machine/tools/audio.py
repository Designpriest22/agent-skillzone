import numpy as np, wave, subprocess
from scipy.signal import butter, sosfilt
sr=48000
raw=subprocess.run(['ffmpeg','-v','error','-ss','3.0','-t','40','-i','../src.mp4','-f','s16le','-ac','2','-ar',str(sr),'-'],capture_output=True).stdout
x=np.frombuffer(raw,np.int16).reshape(-1,2).astype(np.float32)/32768
n=int(40*sr); x=np.pad(x,((0,max(0,n-len(x))),(0,0)))[:n]
t=np.arange(n)/sr
fi=int(0.08*sr); x[:fi]*=np.linspace(0,1,fi)[:,None]
fo0=int(39.2*sr); x[fo0:]*=np.linspace(1,0,n-fo0)[:,None]**1.5
sfx=np.zeros(n,np.float32); rng=np.random.default_rng(3)
def add(sig,at,g):
    i=int(at*sr); j=min(n,i+len(sig)); sfx[i:j]+=sig[:j-i]*g
def boom(d=1.4):
    tt=np.arange(int(d*sr))/sr; f=45+90*np.exp(-tt*9); ph=2*np.pi*np.cumsum(f)/sr
    s=np.sin(ph)*np.exp(-tt*2.6); s+=rng.normal(0,1,len(tt))*np.exp(-tt*40)*0.5
    return np.tanh(s*1.6)
def glitch(d=0.12):
    m=int(d*sr); s=rng.normal(0,1,m); s=np.round(s*3)/3  # crush
    hold=np.repeat(s[::24],24)[:m]; env=np.ones(m); env[-200:]=np.linspace(1,0,200)
    sq=np.sign(np.sin(2*np.pi*np.arange(m)/sr*np.array([180,720,90])[rng.integers(3)]))
    return (hold*0.6+sq*0.4)*env
def beep(f,d=0.07):
    tt=np.arange(int(d*sr))/sr; return np.sin(2*np.pi*f*tt)*np.minimum(1,(d-tt)*80)
def riser(d):
    m=int(d*sr); nz=rng.normal(0,1,m); out=np.zeros(m); ch=int(0.05*sr)
    for k in range(0,m,ch):
        p=k/m; fc=300+6000*p**2
        sos=butter(2,[fc*0.7,min(fc*1.4,20000)],'bandpass',fs=sr,output='sos')
        out[k:k+ch]=sosfilt(sos,nz[k:k+ch])
    tt=np.arange(m)/sr; tone=np.sin(2*np.pi*np.cumsum(150+900*(tt/d)**2)/sr)*0.25
    return (out/np.abs(out).max()+tone)*(tt/d)**2.2
add(beep(1800),1.12,0.25); add(beep(1800),1.24,0.25); add(beep(2400,0.12),1.36,0.2)
add(glitch(0.18),2.40,0.35)
for at in [3.0,3.6,4.2,4.8]: add(glitch(0.1),at,0.3)
add(riser(8.85-5.9),5.9,0.35)
for k,at in enumerate(np.arange(7.8,8.81,1/30*2)): add(glitch(0.03),at,0.18)
for at,g in [(8.877,0.85),(20.22,0.7),(33.316,0.6),(34.779,0.55)]: add(boom(),at,g)
for at in [17.317,19.941,35.232,36.242]: add(glitch(0.08),at,0.25)
for at in [26.617+i*2/30 for i in range(8)]: add(glitch(0.02),at,0.12)
sfx=sosfilt(butter(1,30,'highpass',fs=sr,output='sos'),sfx)
mix=x*0.9+sfx[:,None]*0.5
mix=np.tanh(mix*1.1)/np.tanh(1.1)
w=wave.open('../out/mix.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes()); w.close()
