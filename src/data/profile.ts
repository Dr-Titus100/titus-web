// Facts for the About and Experience pages, taken from Titus's three resumes, his papers and his dissertation.

export const links = {
  linkedin: "https://www.linkedin.com/in/titus-n-nde/",
  github: "https://github.com/Dr-Titus100?tab=repositories",
  scholar: "https://scholar.google.com/citations?user=cLPCRhsAAAAJ",
  orcid: "https://orcid.org/0000-0002-0089-0774",
};

export interface Role {
  title: string;
  org: string;
  orgUrl?: string;
  place: string;
  dates: string;
  tag: "ai" | "research" | "industry" | "teaching";
  points: string[];
}

export const roles: Role[] = [
  {
    title: "Creator, titus-humanizer and other AI skills",
    org: "Independent project",
    orgUrl: "https://github.com/Dr-Titus100/titus-humanizer",
    place: "Remote",
    dates: "2026 – Present",
    tag: "ai",
    points: [
      "Wrote titus-humanizer, an editing skill for Claude and ChatGPT that rewrites text in plain words and keeps every fact, number and name. It runs in claude.ai, the Claude desktop app, ChatGPT, Claude Code and Codex.",
      "Turned my AI-trainer experience, Wikipedia's Signs of AI writing guide and the StoryScope study of AI fiction into seven hard rules, five kinds of weak wording and a set of story-level checks.",
      "Wrote a Python script with no dependencies that strips hidden characters such as zero-width spaces and scores text from 0 to 1 for AI-writing patterns before and after each rewrite.",
      "Built this website so people without Claude or ChatGPT can use the skill. The checker runs the same Python script in the browser with Pyodide, and the rewrite page works with a visitor's own Gemini, Claude or OpenAI key.",
    ],
  },
  {
    title: "AI Trainer (Independent Contractor)",
    org: "Mercor",
    orgUrl: "https://mercor.com",
    place: "Remote",
    dates: "Jul 2026 – Present",
    tag: "ai",
    points: [
      "Graded model-written text against detailed writing-quality rubrics across more than 250 LLM evaluation tasks, and ranked among Mercor's top performers after completing 53 tasks in 30 days.",
      "Ranked and edited model responses for instruction following, reasoning quality and factual accuracy, and wrote structured feedback on the failure patterns I found, for supervised fine-tuning and human-feedback data.",
      "Earned a place on a follow-on writing-quality project because of my writing and how accurately I caught problems in AI-generated text.",
    ],
  },
  {
    title: "AI Trainer (Independent Contractor)",
    org: "Outlier AI",
    orgUrl: "https://outlier.ai",
    place: "Remote",
    dates: "Mar 2026 – Present",
    tag: "ai",
    points: [
      "Earned Beacon status (formerly Oracle) with a 4.0 out of 5.0 average by ranking paired LLM responses, writing evidence-based rationales and rewriting the preferred response for human-feedback and supervised fine-tuning data.",
      "Wrote benchmark tasks for frontier models, including Linux-terminal data analysis tasks that deterministic Python verifiers check and multi-hop research questions with one verifiable answer.",
      "Corrected failed LLM agent trajectories into passing reference runs, and wrote rubrics and Python unit tests that score an agent's multi-step tool use.",
    ],
  },
  {
    title: "Research Affiliate, Earth and Environmental Sciences Unit",
    org: "Lawrence Berkeley National Laboratory",
    orgUrl: "https://www.lbl.gov",
    place: "Berkeley, CA",
    dates: "Jul 2025 – Sep 2025",
    tag: "research",
    points: [
      "Raised the resolution of land surface albedo maps for the Upper Colorado River Basin from 2 km (GOES-R) to 20 m (Sentinel-2) with a two-stage U-Net downscaling pipeline in PyTorch. The maps reached a 0.93 correlation with field measurements.",
      "Combined 21 months of data from three satellites (GOES-R, MODIS and Sentinel-2) with Python geospatial workflows that compute 20 m albedo from Sentinel-2 surface reflectance.",
      "Published the computed and downscaled albedo maps as an open dataset on Zenodo, and submitted the method to IEEE JSTARS.",
    ],
  },
  {
    title: "Graduate Assistant, Research Computing",
    org: "Boise State University",
    orgUrl: "https://www.boisestate.edu/oit-research/",
    place: "Boise, ID",
    dates: "Aug 2024 – Dec 2025",
    tag: "teaching",
    points: [
      "Wrote and updated Python and Linux tutorials and best-practice guides for the Borah supercomputer, so new researchers could start using it faster.",
      "Helped students and faculty fix their computational workflows in weekly HPC office hours.",
      "Organized outreach events about Borah services across campus, and was the principal organizer of the April 2025 Research Computing and SIAM hackathon.",
    ],
  },
  {
    title: "Teaching Assistant, Scientific Computing and Cosmology",
    org: "Department of Physics, Boise State University",
    orgUrl: "https://www.boisestate.edu/physics/",
    place: "Boise, ID",
    dates: "Fall 2023 – Spring 2024",
    tag: "teaching",
    points: [
      "Led tutorials and lab sessions for students in scientific computing and cosmology.",
      "Graded assignments and quizzes.",
    ],
  },
  {
    title: "Ph.D. Researcher, Department of Computing",
    org: "Boise State University",
    orgUrl: "https://www.boisestate.edu/computing/",
    place: "Boise, ID",
    dates: "Aug 2021 – May 2026",
    tag: "research",
    points: [
      "Showed that a selection bias in how surveys identify galaxy clusters inflates their weak lensing mass estimates by 20–50% (20–80% at scales above 3 Mpc). I fit stacked lensing signals from two cosmological simulations (MiniUchuu and Cardinal) with Bayesian MCMC in emcee. Published as first author in Physical Review D (2026).",
      "Quantified model uncertainty across three dissertation projects (galaxy cluster mass calibration, land surface albedo and dryland vegetation height) with Bayesian inference, MCMC and ensemble methods.",
      "Combined machine learning with GEDI and ICESat-2 satellite laser altimetry to estimate dryland vegetation height and its uncertainty, and presented the work at AGU 2024.",
    ],
  },
  {
    title: "Data Analyst",
    org: "KCB Bank Rwanda PLC (now BPR Bank Rwanda PLC)",
    place: "Kigali, Rwanda",
    dates: "Jul 2020 – Jun 2021",
    tag: "industry",
    points: [
      "Built a churn propensity model for micro-credit and mobile-loan customers that scored each customer's probability of leaving with a 0.986 AUC. I compared seven classifiers (XGBoost, AdaBoost, random forest, extra trees, decision tree, k-NN and a multilayer perceptron), and the bank adopted the model for internal use.",
      "Built a dashboard the customer service team used to answer customers who called to ask why the bank had rejected their loan application. Customers who disputed a score went to an operations team for case-by-case review.",
      "Cleared about six months of reconciliation backlog with an automated bank reconciliation tool in R, which cut processing time from 30–45 minutes per file to under 10 seconds.",
      "Built R Shiny dashboards for the customer service, operations and credit risk departments, including a social media dashboard that tracked engagement and customer sentiment.",
      "Built a Python transcription tool that turns audio recordings into PDF or Word documents. Human Resources used it to transcribe recordings of disciplinary proceedings.",
      "Built an R Shiny chatbot that answers routine customer service questions, and wrote user documentation for each tool I deployed.",
    ],
  },
  {
    title: "Graduate Researcher, Credit Risk Modeling",
    org: "African Institute for Mathematical Sciences (AIMS), with Innovative Microfinance Ltd., Ghana",
    orgUrl: "https://aims.ac.rw",
    place: "Kigali, Rwanda",
    dates: "Aug 2019 – Feb 2021",
    tag: "research",
    points: [
      "Sorted 4,404 micro-loan borrowers into three risk classes with 81% test accuracy and a 0.96 micro-average AUC, comparing seven models on loan records from January 2012 to July 2018. The lender's credit scoring team adopted the model.",
      "Corrected an 84% majority-class imbalance with SMOTENC, tuned hyperparameters and ranked default drivers with permutation importance. Age, loan amount and annualized interest rate ranked highest in the top three models.",
      "Found with a Cox proportional hazards model that defaults rise after six months of repayment, and recommended micro-loan terms of six months or less.",
    ],
  },
  {
    title: "Teaching Assistant",
    org: "Department of Statistics, University for Development Studies",
    place: "Navrongo, Ghana",
    dates: "Sep 2018 – Aug 2019",
    tag: "teaching",
    points: [
      "Led tutorials in econometrics, probability and the R programming language.",
      "Helped five students with their undergraduate projects.",
      "Helped run the department's daily administration.",
    ],
  },
  {
    title: "Intern, Health Insurance Claims Unit",
    org: "Tamale Central Hospital",
    place: "Tamale, Ghana",
    dates: "May 2017 – Aug 2017",
    tag: "industry",
    points: [
      "Filed health insurance claims and kept daily records of patients.",
      "Assigned wards and bed numbers to admitted patients.",
    ],
  },
  {
    title: "Community Studies",
    org: "Wanjagenia community",
    place: "Manyoro, Ghana",
    dates: "May 2015 – Jul 2016",
    tag: "research",
    points: [
      "Carried out a needs assessment for the Wanjagenia community.",
      "Ran a population and housing census of the community.",
      "Wrote a community profile and a development proposal for the community.",
    ],
  },
];

export const education = [
  {
    degree: "Ph.D. in Computing, Data Science Emphasis",
    school: "Boise State University, Boise, ID",
    date: "May 2026",
    notes: [
      "Dissertation: From the cosmos to the canopy: quantifying uncertainty across cosmological and environmental systems.",
      "Comprehensive exam: dark matter halo density profile calibration.",
      "Advisor: Prof. Nancy F. Glenn. GPA 4.0/4.0.",
    ],
  },
  {
    degree: "M.Sc. in Mathematical Sciences (Distinction)",
    school: "African Institute for Mathematical Sciences (AIMS), Kigali, Rwanda",
    date: "Feb 2021",
    notes: [
      "Thesis: Credit risk modeling in microfinance: a case study of a microfinance institution in Ghana.",
      "Advisor: Prof. Corina Constantinescu (University of Liverpool). Mastercard Foundation Scholar with full funding.",
    ],
  },
  {
    degree: "B.Sc. in Actuarial Science (First-Class Honors)",
    school: "University for Development Studies, Tamale, Ghana",
    date: "Sep 2014 – Jul 2018",
    notes: [
      "Thesis: Gamma distribution modeling and time series analysis and forecasting of rainfall in the Tamale Metropolitan Assembly, Ghana.",
      "Advisor: Dr. Ernest Zamanah. GPA 4.58/5.0.",
    ],
  },
];

export const publications = [
  {
    cite: "Nde, T. N., Wu, H.-Y., Cao, S., Kamau, G. M., Tamosiunas, A., To, C.-H., and Zhou, C. (2026). Impact of projection-induced optical selection bias on the weak lensing mass calibration of galaxy clusters. Physical Review D, 113(6), 063559.",
    url: "https://doi.org/10.1103/h9xq-k9gh",
    label: "doi.org/10.1103/h9xq-k9gh",
  },
  {
    cite: "Ampountolas, A., Nyarko Nde, T., Date, P., and Constantinescu, C. (2021). A machine learning approach for micro-credit scoring. Risks, 9(3), 50. Cited more than 100 times.",
    url: "https://doi.org/10.3390/risks9030050",
    label: "doi.org/10.3390/risks9030050",
  },
  {
    cite: "Dataset: Nde, T. N., Yu, F., Feldman, D., Lang, O., Rudisill, W., Glenn, N., Mead, J., and Flores, A. (2026). Computed and U-Net-downscaled land surface albedo at MODIS (500 m) and Sentinel-2 (20 m) resolution over SAIL (2021–2023) using GOES-R (Version 1.0.0). Zenodo.",
    url: "https://doi.org/10.5281/zenodo.21798650",
    label: "doi.org/10.5281/zenodo.21798650",
  },
  {
    cite: "Under review: Nde, T. N., Yu, F., Feldman, D., Lang, O. I., Rudisill, W., Glenn, N. F., Mead, J., and Flores, A. Using low-Earth-orbit instruments and neural networks to downscale geostationary surface albedo products. Submitted to IEEE JSTARS, and presented at AGU 2025.",
  },
  {
    cite: "In preparation: Nde, T. N., Enterkine, J., and Glenn, N. F. Integrating machine learning and satellite laser altimetry to quantify uncertainty in vegetation height estimation in dryland vegetation. Presented at AGU 2024, the BSU Graduate Showcase 2025 and Hackforth at Treefort Music Fest 2025.",
  },
  {
    cite: "In preparation: Afful, J., Nde, T. N., Onyenemezu, O., Kyanjo, B., Asaaga, B. A., and Akowuah, J. O. Introducing HPC-enabled computational research training in Africa: a pilot study.",
  },
];

export const talks = [
  ["Aug 2026", "Co-presenter, Research Software Africa (RSAfrica26), online"],
  ["Dec 2025", "Co-presenter, AGU Annual Meeting, New Orleans"],
  ["Nov 2025", "Poster, Pacific Northwest Water Summit, Boise State University"],
  ["Apr 2025", "Principal organizer, Research Computing and SIAM BSU Hackathon, Boise State University"],
  ["Mar 2025", "Poster, Hackforth Graduate Tech Showcase at Treefort Music Fest, Boise"],
  ["Dec 2024", "Lightning talk and e-poster, AGU Annual Meeting, Washington, DC"],
  ["Nov 2024", "Attendee, Supercomputing (SC24), Atlanta"],
  ["Jul 2024", "Poster, International HPC Summer School, Kobe, Japan"],
  ["2024", "Poster on dark matter halo mass calibration, BSU Graduate Showcase"],
  ["Nov 2023", "Coach and mentor, SCUDEM VIII 2023 modeling challenge"],
  ["Jun 2023", "Attendee, Cluster Cosmology Workshop, University of Arizona"],
  ["Jun 2023", "Attendee, Cosmology Summer School, University of Michigan"],
  ["Aug 2022", "Attendee, La Serena School for Data Science, online"],
  ["Jul 2022", "Attendee, DeepHyper Automated ML Workshop, online"],
  ["Jun 2022", "Co-organizer and speaker, Boise State University Cluster Cosmology Workshop"],
  ["Jun 2022", "Attendee, Summer School in Astrostatistics and Astroinformatics, Center for Astrostatistics, Pennsylvania State University"],
  ["Jul 2021", "Attendee, 4th Institute of Space Sciences Summer School: Artificial Intelligence for Astronomy, online"],
];

export const leadership = [
  ["Co-founder and instructor", "Center for Computational Research and Education (CCRE)", "Leads an annual six-week online HPC training and research program (May to June) for students and early-career researchers in Africa. Teaches Linux, remote computing, cluster use, job scheduling, parallel computing, debugging and reproducible research, and mentors team projects on real HPC resources that end in a research symposium."],
  ["President (Mar 2024 – Jul 2025), Vice President (Mar 2023 – Mar 2024), Events Officer (Apr 2022 – Mar 2023)", "SIAM Student Chapter, Boise State University", ""],
  ["Vice President (Aug 2024 – Jul 2025)", "International Students Association, Boise State University", ""],
  ["Mentor (Jul 2024 – May 2025)", "International Students Peer Mentorship Program, Boise State University", ""],
  ["Volunteer (Sep 2024 – May 2025)", "STEM Nights for Elementary Schools and Refugee Families, Boise", ""],
  ["Students' Representative (Sep 2019 – Jul 2020)", "AIMS Rwanda, 4th cohort", ""],
  ["Vice President (Apr 2017 – Apr 2018)", "Actuarial Science Students' Association of Ghana (ASSAG), UDS Chapter", ""],
  ["Member (Mar 2015 – Jul 2018)", "Transformational Leadership International (TLI), UDS Chapter", ""],
];

export const awards = [
  ["Dec 2025", "Bronco Spirit Award for academic excellence and leadership, Boise State University"],
  ["2021", "U.S. Department of Energy funding (Grant DE-SC0021916) for my Ph.D."],
  ["Mar 2020", "IBM certificates in Data Science, Machine Learning and Deep Learning"],
  ["Feb 2020", "Dataquest certificate in Data Science"],
  ["Aug 2019", "Mastercard Foundation Scholar, fully funded M.Sc. at AIMS Rwanda"],
  ["Nov 2018", "Prudential Actuarial Support Scheme (PASS) award for excellence in Actuarial Science, Ghana"],
  ["2013", "Overall best student in the West African Senior School Certificate Examination (WASSCE), Business Senior High School (BISCO), Tamale, Ghana"],
];

export const skills = [
  ["Machine learning", "XGBoost, random forest, AdaBoost, gradient boosting, deep learning (U-Net, CNN, MLP), classification, churn and credit risk modeling, hyperparameter tuning, class imbalance (SMOTENC)"],
  ["Statistics", "Bayesian inference, MCMC, ensemble uncertainty quantification, survival analysis (Cox proportional hazards), causal inference, time series forecasting"],
  ["AI evaluation", "Rubric-based LLM evaluation, human-feedback (RLHF) and supervised fine-tuning data, benchmark and verifier design, agent trajectory review, Claude and ChatGPT skill authoring"],
  ["Languages and libraries", "Python, R, SQL, MATLAB, PyTorch, TensorFlow, Keras, scikit-learn, NumPy, Pandas, Xarray, basic C++ and HTML"],
  ["Geospatial", "Rasterio, GeoPandas, GDAL, PDAL, ArcGIS, LAStools, Sentinel-2, MODIS, GOES-R, GEDI and ICESat-2 data"],
  ["Computing and tools", "Linux, Slurm, HPC clusters, AWS, Git, GitHub, VS Code, Jupyter, R Shiny, Power BI, Tableau, Matplotlib, Seaborn, Excel, SPSS, GRETL, Minitab, EasyFit, LaTeX, Microsoft Office, LibreOffice, Windows and macOS"],
];

// The address shown on the site. Messages from the contact form go to a different, private address,
// which lives only in the Web3Forms account that issued the key below. The key is safe to publish.
export const publicEmail = "ndedrtitusn100@gmail.com";
export const contactFormKey = "48ee3263-5462-45f5-90f8-58a6f2bc0f49";
// The public site key of a Cloudflare Turnstile widget for blog comments. Leave it empty to turn the
// check off. When you fill it in, also set the widget's secret key as TURNSTILE_SECRET on the Worker.
// With both set, comments that pass the check show at once. Without them, every comment waits for approval.
export const commentsTurnstileKey = "";
