import numpy as np, wave, subprocess, sys
from scipy.signal import butter, sosfilt
sr=48000; DUR=20.0; OFF=7.877
src=sys.argv[1]; out=sys.argv[2]
raw=subprocess.run(['ffmpeg','-v','error','-ss',str(OFF),'-t',str(DUR),'-i',src,'-f','s16le','-ac','2','-ar',str(sr),'-'],capture_output=True).stdout
x=np.frombuffer(raw,np.int16).reshape(-1,2).astype(np.float32)/32768
n=int(DUR*sr); x=np.pad(x,((0,max(0,n-len(x))),(0,0)))[:n]
x[:int(0.5*sr)]*=np.linspace(0.25,1,int(0.5*sr))[:,None]   # music ducked under the open/fizz sting
fo=int(19.0*sr); x[fo:]*=np.linspace(1,0,n-fo)[:,None]**1.5
sfx=np.zeros(n,np.float32); rng=np.random.default_rng(5)
def add(sig,at,g):
    i=int(at*sr); j=min(n,i+len(sig)); sfx[i:j]+=sig[:j-i]*g
def bp(sig,lo,hi): return sosfilt(butter(2,[lo,hi],'bandpass',fs=sr,output='sos'),sig)
def crack():  # can/bottle open: sharp click + hiss
    m=int(0.35*sr); tt=np.arange(m)/sr; nz=rng.normal(0,1,m)
    hiss=bp(nz,2500,12000)*np.exp(-tt*9); click=np.zeros(m); click[:240]=rng.normal(0,1,240)*np.linspace(1,0,240)*3
    return hiss+click
def fizz(d=1.6):  # sparse bubble pops
    m=int(d*sr); s=np.zeros(m); tt=np.arange(m)/sr
    for _ in range(int(d*260)):
        i=rng.integers(0,m-400); f=rng.uniform(2500,7000); L=rng.integers(80,300)
        s[i:i+L]+=np.sin(2*np.pi*f*np.arange(L)/sr)*np.exp(-np.arange(L)/(L/4))*rng.uniform(0.2,1)
    return (s+bp(rng.normal(0,1,m),4000,14000)*0.25)*np.exp(-tt*1.6)
def boom(d=1.3):
    tt=np.arange(int(d*sr))/sr; f=45+90*np.exp(-tt*9); ph=2*np.pi*np.cumsum(f)/sr
    s=np.sin(ph)*np.exp(-tt*2.6)+rng.normal(0,1,len(tt))*np.exp(-tt*40)*0.5
    return np.tanh(s*1.6)
def whoosh(d=0.45):
    m=int(d*sr); tt=np.arange(m)/sr; env=np.sin(np.pi*tt/d)**2
    return bp(rng.normal(0,1,m),600,6000)*env
def glitch(d=0.1):
    m=int(d*sr); s=np.round(rng.normal(0,1,m)*3)/3; hold=np.repeat(s[::24],24)[:m]
    sq=np.sign(np.sin(2*np.pi*np.arange(m)/sr*[180,720,90][rng.integers(3)])); env=np.ones(m); env[-200:]=np.linspace(1,0,200)
    return (hold*0.6+sq*0.4)*env
def riser(d):
    m=int(d*sr); nz=rng.normal(0,1,m); o=np.zeros(m); ch=int(0.05*sr)
    for k in range(0,m,ch):
        p=k/m; fc=300+6000*p**2; o[k:k+ch]=bp(nz[k:k+ch],fc*0.7,min(fc*1.4,20000))
    tt=np.arange(m)/sr; return o/np.abs(o).max()*(tt/d)**2.2
add(crack(),0.05,0.55); add(fizz(1.7),0.2,0.35)
add(whoosh(),1.45,0.4); add(fizz(0.8),1.95,0.2)
for at in [2.6,3.118,3.55]: add(glitch(),at,0.28)
add(riser(4.0-2.6),2.6,0.32)
for at,g in [(4.0,0.85),(12.44,0.7),(15.343,0.6)]: add(boom(),at,g)
add(fizz(1.4),17.665,0.25)
sfx=sosfilt(butter(1,30,'highpass',fs=sr,output='sos'),sfx)
mix=np.tanh((x*0.9+sfx[:,None]*0.5)*1.1)/np.tanh(1.1)
w=wave.open(out,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes()); w.close()
