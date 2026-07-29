import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer";

jest.mock("next/link", () => ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>);

jest.mock("next/image", () => ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />);

jest.mock("lucide-react", () => ({
  Mail: () => <svg data-testid="icon-mail" />,
  MapPin: () => <svg data-testid="icon-mappin" />,
}));

jest.mock("@/context/I18nContext", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "app.name": "Ethio Nikah",
        "footer.tagline": "Find your righteous spouse",
        "footer.platform": "Platform",
        "footer.support": "Support",
        "footer.legal": "Legal",
        "footer.browseMatches": "Browse Matches",
        "footer.search": "Search",
        "footer.verification": "Verification",
        "footer.privacySettings": "Privacy Settings",
        "footer.faq": "FAQ",
        "footer.contactUs": "Contact Us",
        "footer.reportAbuse": "Report Abuse",
        "footer.safetyTips": "Safety Tips",
        "footer.terms": "Terms & Conditions",
        "footer.privacyPolicy": "Privacy Policy",
        "footer.communityGuidelines": "Community Guidelines",
        "footer.shariaCompliance": "Sharia Compliance",
        "footer.rights": "All rights reserved.",
      };
      return map[key] || key;
    },
    lang: "en",
    setLang: jest.fn(),
  }),
}));

describe("Footer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders footer element", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders brand name", () => {
    render(<Footer />);
    expect(screen.getAllByText(/Ethio/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Nikah").length).toBeGreaterThanOrEqual(1);
  });

  it("renders contact email", () => {
    render(<Footer />);
    expect(screen.getByText("ethiopianikah@gmail.com")).toBeInTheDocument();
  });

  it("does not render phone number", () => {
    render(<Footer />);
    expect(screen.queryByText("0911348962")).not.toBeInTheDocument();
  });

  it("renders contact location", () => {
    render(<Footer />);
    expect(screen.getByText("Addis Ababa, Ethiopia")).toBeInTheDocument();
  });

  it("renders all contact icons", () => {
    render(<Footer />);
    expect(screen.getByTestId("icon-mail")).toBeInTheDocument();
    expect(screen.getByTestId("icon-mappin")).toBeInTheDocument();
  });

  it("renders copyright with current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(year.toString()))).toBeInTheDocument();
  });

  it("renders Platform section links", () => {
    render(<Footer />);
    expect(screen.getByText("Browse Matches")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Verification")).toBeInTheDocument();
    expect(screen.getByText("Privacy Settings")).toBeInTheDocument();
  });

  it("renders Support section links", () => {
    render(<Footer />);
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    expect(screen.getByText("Report Abuse")).toBeInTheDocument();
    expect(screen.getByText("Safety Tips")).toBeInTheDocument();
  });

  it("renders Legal section links", () => {
    render(<Footer />);
    expect(screen.getByText("Terms & Conditions")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Community Guidelines")).toBeInTheDocument();
    expect(screen.getByText("Sharia Compliance")).toBeInTheDocument();
  });

  it("renders section headings", () => {
    render(<Footer />);
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
  });

  it("renders logo image", () => {
    render(<Footer />);
    const img = screen.getByAltText("Ethio Nikah");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/logo.png");
  });
});
