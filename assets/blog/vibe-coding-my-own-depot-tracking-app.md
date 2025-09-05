### **04-09-2025**
### **Building my first application with agentic AI (#VibeCoding)**

Recently, my LinkedIn feed has been overflowing with posts about "vibe coding" and AI agents. Engineers - and even non-programmers - are building entire applications just by talking to an agent. Since I've already integrated LLMs into both my daily engineering work and personal projects, I was curious: Could I really build a complete application using nothing but my voice and AI assistance?

I decided to find out. My goal: create an investment portfolio analysis app with dividend tracking features - something I'd wanted for personal use anyway. Most existing apps like those from Finanzfluss or Parqet hide their best dividend features behind paywalls. Time to build my own.

I already had some groundwork done: OAuth2 authentication with Comdirect's developer API, data retrieval, and a rough architecture for my Flask / Dash application. But the implementation was minimal, and the UI looked like it was designed by an embedded software engineer. It was the perfect starting point for a vibe coding experiment - especially with an agent that would hopefully have a better sense for design and UX than I do.
<div class="section-break"></div>

#### **My setup and starting point**

Before diving in, I set up my environment properly:

- VS Code with GitHub Copilot / GitHub Copilot Chat and activated agent mode
- VS Code Speech extension for true "vibe coding" (speech-to-text functionality)


Because I had started the project earlier without an integrated AI agent, I already had the basic architecture and some features in place. Having a clear picture of what I wanted to achieve helped me guide the AI effectively. I quickly realized that the agent doesn't need to know the full scope - it's best to focus on simple tasks, one after another.
<div class="section-break"></div>


#### **What I built in just a few evenings**

The results far exceeded my expectations and matched the hype I'd seen in all those LinkedIn posts. In just a handful of evenings, I managed to implement an app with the following features:

- Retrieve data from main and secondary depots and accounts via the Comdirect REST API (Developer Portal). Authenticate via photo TAN.
- List current positions including purchase prices & values, current prices & values, performance, and allocation. Current stock prices are retrieved from Yahoo Finance.


- Continuously parse account statements to capture and store dividend payments in a persistent local database
- List total dividends received by a single asset in the depot table
- List the 3-Month-Momentum of an asset. I don't like tracking stock prices all the time. This metric quickly gives me an impression of how an asset is currently performing compared to the overall market.
- List multiple depots separately or combined in a single portfolio (allocation adapts accordingly)
- Comprehensive dividend analytics: total dividends per asset, net income over multiple years, monthly averages
- Detailed dividend income table with filtering by company, date ranges, and amounts
- Visual charts showing dividend income trends over time
- Calculate asset allocation and visualize it with pie charts. In addition to the usual categories (asset classes, sectors, regions), I also added a custom "Personal Risk Estimation" category, allowing me to classify each asset based on my own risk assessment (low, medium, high risk). This gives me a quick overview of the overall risk profile of my portfolio from my personal perspective.
<div class="section-break"></div>

<div class="image-carousel">
    <button class="carousel-arrow left" onclick="carouselPrev()">&#8592;</button>
    <img id="carousel-img" src="/assets/blog/img/asset-allocation.png" alt="Asset Allocation" onclick="openModal()" style="cursor: pointer;" />
    <button class="carousel-arrow right" onclick="carouselNext()">&#8594;</button>
</div>

<div id="img-modal" class="img-modal" onclick="closeModal(event)">
  <img id="modal-img" src="" alt="Enlarged image" />
</div>

<style>
.image-carousel {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 16px 0;
}
.image-carousel img {
    width: 90%;
    max-width: 90vw;
    height: auto;
    border-radius: 0px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    flex-shrink: 0;
    transition: opacity 0.3s;
}
.img-modal {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.7);
    align-items: center;
    justify-content: center;
    cursor: zoom-out;
}
.img-modal.active {
    display: flex;
}
.img-modal img {
    max-width: 95vw;
    max-height: 90vh;
    border-radius: 16px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.25);
    background: #fff;
    margin: auto;
}

.carousel-arrow {
    font-size: 2rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #163853;
    padding: 0 12px;
    user-select: none;
}
.carousel-arrow:focus {
    outline: none;
}
</style>
<div class="section-break"></div>

If you have a Comdirect account, you can try the app yourself. The source code is available on [my GitHub](https://github.com/raffael-kaas7/depot_tracker) and all relevant information is available in the README. You just need to register yourself in order to get your secrets for the Developer API.
<div class="section-break"></div>

#### **Lessons learned from vibe coding**

This experiment taught me that you can simply start using agentic AI without learning much about best practices in advance. It works from the very beginning to build features and get running results. Over time, you will quickly learn and adapt your workflow based on what works best for you along with the agent. Here are some of my key takeaways from vibe coding my first project:
<div class="section-break"></div>

- **Begin with the end in mind:** Just like Stephen Covey's second habit, having a clear vision of the final product and how you would implement it from an architectural point of view is crucial. In my opinion, the agent doesn't need to know the final product, but you should.

- **Break everything down:** Don't try to build multiple features simultaneously. Let the agent complete one task before moving to the next. Think of creating user stories from an epic, assigning them all to the AI agent.

- **Create a prompt.md file:** Be specific about how to implement things and refer to this file during conversations, so you do not need to repeat yourself all the time and can focus on describing the actual tasks you want to implement.

    ```bash
    ---
    name: depot tracker prompt
    description: Guidelines for coding the depot tracker app
    applyTo: ["./**"]
    ---
    - Always activate the virtual python environment before executing terminal commands (source .venv/bin/activate)
    - Never hardcode secrets. Use environment variables via `dotenv`.
    - All functions must include docstrings explaining the purpose and parameters.
    - Comment the intent of functionality (explain the "why" and purpose, not the "what")
    - Use comments to explain how Dash components work, to get me into the topic
    - Follow PEP 8 style guidelines
    - Include type hints for all function signatures.
    - Use private methods where appropriate and object-oriented programming principles.
    ```

- **Always review the code:** In my case, the AI agent tends to implement backend logic in frontend components, instantiate objects unnecessarily, or create inefficient algorithms/structures. A quick review catches these issues, and the second iteration almost always works perfectly.

- **Commit early and often:** Make a commit after each working task. When the agent occasionally goes off track (and it will), you can easily revert to the last known proper state.

- **Environment isolation is highly recommended:** Using a dedicated virtual environment definitely makes sense. The agent often wants to install packages and dependencies on its own. Having a separate environment prevents messing up your global installations.
<div class="section-break"></div>


#### **Final thoughts**

Working with the agent on my project was really impressive. Complex features that would normally take me hours to research, implement, and debug were completed in minutes of conversation and copy-pasting terminal output.

I don't think the agent will completely replace software engineering skills – it's about boosting efficiency. Understanding good architecture, data structures, and clean code principles become even more important when working with AI. You need to guide the agent towards good solutions and catch the bad ones quickly. Nevertheless, I do think that even non-programmers can easily implement a working prototype of their (business-) ideas with the help of AI agents.

My own depot tracker app serves the purpose I intended. More importantly, I got first experience on how to effectively collaborate with AI to build a simple software product. To be honest, I might consider some refactoring in the future when I want to extend the app, but for now, it just works.

I think it is important for software engineers to spend time in learning how to prompt and guide AI agents effectively. Like any tool, the better you understand its capabilities and limitations, the more value you can extract. This is definitely not a temporary trend but a fundamental shift in how we build software.
<div class="section-break"></div>