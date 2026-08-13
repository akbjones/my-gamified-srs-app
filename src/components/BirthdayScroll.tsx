import React, { useState } from 'react';

// One-time birthday scroll for the mum deck (?gift=mum). A sealed parchment
// roll; tapping the wax seal unfurls it and reveals the message. Shown once
// (quest_mum_scroll_seen, written at trigger time in App.tsx). The parchment
// deliberately keeps one look in both themes – it is a physical object.
interface Props {
  onClose: () => void;
}

const BirthdayScroll: React.FC<Props> = ({ onClose }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bday-overlay" role="dialog" aria-label="Message d'anniversaire">
      <style>{`
        .bday-overlay{position:fixed;inset:0;z-index:10002;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(120% 120% at 50% 20%, #2b3350 0%, #171b2c 55%, #0e1120 100%);padding:1.5rem;}
        .bday-roll{height:56px;width:min(88vw,340px);border-radius:28px;background:linear-gradient(180deg,#f7ecd4 0%,#e8d7b4 45%,#c9b489 100%);box-shadow:0 10px 30px rgba(0,0,0,.45), inset 0 -6px 10px rgba(122,95,55,.35), inset 0 6px 8px rgba(255,250,235,.7);}
        .bday-seal{width:74px;height:74px;border-radius:50%;margin-top:-37px;z-index:2;border:none;cursor:pointer;background:radial-gradient(circle at 35% 30%, #c4453f 0%, #9e2f2c 55%, #6f1f1e 100%);box-shadow:0 6px 18px rgba(0,0,0,.5), inset 0 2px 6px rgba(255,160,150,.5), inset 0 -4px 8px rgba(60,10,10,.6);color:#f6dfc9;font-family:'Iowan Old Style',Palatino,Georgia,serif;font-size:2rem;line-height:1;display:flex;align-items:center;justify-content:center;transition:transform .15s ease;}
        .bday-seal:active{transform:scale(.94);}
        .bday-hint{color:#cfd4e8;font-size:.85rem;margin-top:1.1rem;letter-spacing:.02em;opacity:.85;}
        .bday-paper-wrap{width:min(92vw,380px);display:flex;flex-direction:column;align-items:center;}
        .bday-paper{width:100%;max-height:0;overflow:hidden;background:linear-gradient(180deg,#f9f1dd 0%,#f4e8cd 60%,#eddfc0 100%);border-left:1px solid #d8c49c;border-right:1px solid #d8c49c;box-shadow:0 18px 50px rgba(0,0,0,.5), inset 0 0 40px rgba(160,130,80,.18);animation:bday-unfurl 2.1s cubic-bezier(.22,.75,.25,1) .1s forwards;}
        .bday-paper-inner{padding:1.9rem 1.7rem 1.5rem;overflow-y:auto;max-height:62vh;}
        .bday-paper p{font-family:'Iowan Old Style',Palatino,Georgia,serif;color:#3d3020;font-size:1.02rem;line-height:1.65;margin:0 0 1em;opacity:0;animation:bday-ink .9s ease forwards;}
        .bday-paper p:nth-child(1){animation-delay:.9s}
        .bday-paper p:nth-child(2){animation-delay:1.4s}
        .bday-paper p:nth-child(3){animation-delay:1.9s}
        .bday-paper p:nth-child(4){animation-delay:2.4s}
        .bday-sig{text-align:right;font-style:italic;font-size:1.12rem;animation-delay:2.9s !important;margin-bottom:0 !important;}
        .bday-endroll{height:34px;width:min(92vw,380px);border-radius:17px;margin-top:-2px;background:linear-gradient(180deg,#efe2c2 0%,#d9c59c 50%,#bda679 100%);box-shadow:0 8px 22px rgba(0,0,0,.4), inset 0 -4px 8px rgba(110,85,48,.35), inset 0 3px 6px rgba(255,250,235,.6);}
        .bday-start{margin-top:1.6rem;padding:.8rem 1.6rem;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#f0e9d8;font-size:.95rem;cursor:pointer;opacity:0;animation:bday-ink .8s ease 3.4s forwards;backdrop-filter:blur(4px);}
        .bday-start:focus-visible,.bday-seal:focus-visible{outline:2px solid #f0e9d8;outline-offset:3px;}
        @keyframes bday-unfurl{from{max-height:0}to{max-height:62vh}}
        @keyframes bday-ink{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){
          .bday-paper{animation:none;max-height:62vh}
          .bday-paper p,.bday-start{animation:none;opacity:1;transform:none}
        }
      `}</style>

      {!open ? (
        <>
          <div className="bday-roll" />
          <button className="bday-seal" onClick={() => setOpen(true)} aria-label="Ouvrir le message">
            A
          </button>
          <div className="bday-hint">Appuie sur le sceau pour ouvrir</div>
        </>
      ) : (
        <div className="bday-paper-wrap">
          <div className="bday-roll" style={{ height: 34, borderRadius: 17 }} />
          <div className="bday-paper">
            <div className="bday-paper-inner">
              <p>
                Maman, je te souhaite le meilleur des anniversaires. J'espère que ce jeu
                de cartes te plaira. Je cherchais le juste milieu entre blagues à la con,
                phrases de tous les jours et, bien sûr, quelques phrases qui pourraient
                nous servir en Bolivie.
              </p>
              <p>
                Je t'aime énormément, tu me manques et j'ai trop hâte de vous revoir
                en octobre.
              </p>
              <p>
                Merci pour tout ton soutien, ton amour et comment que tu la trouves
                c'te glace BIENGUE
              </p>
              <p className="bday-sig">Antoine</p>
            </div>
          </div>
          <div className="bday-endroll" />
          <button className="bday-start" onClick={onClose}>
            Ouvrir le jeu de cartes
          </button>
        </div>
      )}
    </div>
  );
};

export default BirthdayScroll;
