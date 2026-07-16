import { Link } from 'react-router-dom';
import JewelArt from '../components/JewelArt';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';

export default function NotFound() {
  usePageTitle(STRINGS.titles.notFound);

  return (
    <section className="section">
      <div className="container center empty-state notfound">
        <div className="notfound-art"><JewelArt art="pendant" /></div>
        <span className="section-eyebrow">{STRINGS.notFound.eyebrow}</span>
        <h2 className="serif">{STRINGS.notFound.title}</h2>
        <p className="muted">{STRINGS.notFound.text}</p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-dark">{STRINGS.notFound.home}</Link>
          <Link to="/shop" className="btn btn-ghost">{STRINGS.notFound.shop}</Link>
        </div>
      </div>
    </section>
  );
}
