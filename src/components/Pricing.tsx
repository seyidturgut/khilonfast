import './Pricing.css'

export default function Pricing() {
    return (
        <section className="pricing">
            <div className="pricing-background">
                <img src="/oval-top.png" alt="" className="oval-pattern" />
            </div>

            <div className="container pricing-container">
                <div className="pricing-content">
                    <h2 className="pricing-title">
                        Hizmetlerimizde Net ve Şeffaf<br />
                        Fiyatlandırma
                    </h2>
                    <p className="pricing-description">
                        khilonfast olarak, kapsamlı pazarlama hizmetlerimiz için müşterilerimize şeffaf bir
                        fiyatlandırma sunmaya inanıyoruz. Fiyatlandırmada netlik ve sadeli ğin önemini biliyor ve
                        işletmelerin çeşitli ihtiyaçlarına göre uyarlanmış sade bir yapı sunuyoruz.
                    </p>
                    <button className="btn btn-pricing">
                        Daha Fazlası
                    </button>
                </div>
            </div>
        </section>
    )
}
