
import React from "react";
import "./RulesRegulations.css";

function RulesRegulations() {
  const rules = [
    {
      number: "01",
      title: "Attendance & Punctuality",
      points: [
        "Employees must check in and check out through the employee portal every working day.",
        "Employees should report to work on time according to their assigned schedule.",
        "Any planned absence or late arrival should be communicated to the reporting manager.",
        "Employees must not mark attendance on behalf of another employee.",
      ],
    },
    {
      number: "02",
      title: "Leave Policy",
      points: [
        "Leave requests should be submitted through the employee portal in advance whenever possible.",
        "Employees should obtain approval before taking planned leave.",
        "In case of an emergency, the manager or HR should be informed as soon as possible.",
        "Employees should not misuse or provide false information for leave requests.",
      ],
    },
    {
      number: "03",
      title: "Workplace Conduct",
      points: [
        "Employees are expected to behave professionally and respectfully with colleagues, managers, clients, and visitors.",
        "Harassment, bullying, discrimination, threats, and inappropriate behavior are not permitted.",
        "Employees should maintain a positive and collaborative work environment.",
      ],
    },
    {
      number: "04",
      title: "Dress Code",
      points: [
        "Employees should follow the company's prescribed dress code where applicable.",
        "Clothing should be clean, professional, and appropriate for the workplace and role.",
      ],
    },
    {
      number: "05",
      title: "Company Equipment",
      points: [
        "Company laptops, phones, ID cards, and other equipment must be used responsibly.",
        "Employees should not share company devices or credentials with unauthorized persons.",
        "Lost or damaged company property should be reported to the appropriate department immediately.",
      ],
    },
    {
      number: "06",
      title: "Data & Information Security",
      points: [
        "Employees must keep company and customer information confidential.",
        "Passwords and login credentials must never be shared with others.",
        "Employees should lock their computers when leaving their workstation.",
        "Confidential company information should not be shared through unauthorized applications or personal accounts.",
      ],
    },
    {
      number: "07",
      title: "Internet & Email Usage",
      points: [
        "Company email and internet resources should primarily be used for work-related activities.",
        "Employees should not access, download, or distribute inappropriate or unauthorized content using company systems.",
        "Suspicious emails, links, or attachments should be reported to the IT team.",
      ],
    },
    {
      number: "08",
      title: "Work From Home",
      points: [
        "Employees working remotely must remain available during their assigned working hours.",
        "Employees should maintain a suitable and secure workspace.",
        "Company data should only be accessed using approved systems and devices.",
      ],
    },
    {
      number: "09",
      title: "Meetings & Communication",
      points: [
        "Employees should attend required meetings on time.",
        "Important work-related communication should be handled through approved company communication channels.",
        "Employees should respond to work-related messages within a reasonable time.",
      ],
    },
    {
      number: "10",
      title: "Health & Safety",
      points: [
        "Employees must follow workplace health and safety instructions.",
        "Any accident, safety concern, or workplace hazard should be reported immediately.",
        "Emergency procedures and evacuation instructions must be followed.",
      ],
    },
    {
      number: "11",
      title: "Use of Social Media",
      points: [
        "Employees should not disclose confidential company information on social media.",
        "Employees should avoid representing personal opinions as official company statements.",
        "Company logos, documents, or internal information should not be shared without authorization.",
      ],
    },
    {
      number: "12",
      title: "Performance & Responsibilities",
      points: [
        "Employees are expected to complete assigned tasks within agreed deadlines.",
        "Employees should maintain the quality and accuracy of their work.",
        "Employees should participate in performance reviews and required training programs.",
      ],
    },
    {
      number: "13",
      title: "Company Property & Facilities",
      points: [
        "Employees should use office facilities and resources responsibly.",
        "Meeting rooms, workstations, and common areas should be kept clean.",
        "Company property should not be removed from the workplace without authorization.",
      ],
    },
    {
      number: "14",
      title: "Compliance",
      points: [
        "Employees must follow applicable company policies, procedures, and legal requirements.",
        "Any suspected violation of company policy should be reported to HR or the appropriate authority.",
      ],
    },
    {
      number: "15",
      title: "Disciplinary Action",
      points: [
        "Violations of company rules may result in appropriate corrective or disciplinary action according to company policy.",
        "Serious violations involving security, harassment, fraud, or misconduct may be escalated to HR or management.",
      ],
    },
  ];

  return (
    <div className="rules-page">

      {/* Page Header */}
      <div className="rules-header">
        <div>
          <h1>Rules & Regulations</h1>
          <p>
            Please review and follow the company policies and guidelines
            applicable to all employees.
          </p>
        </div>

        <div className="rules-badge">
          Employee Guidelines
        </div>
      </div>

      {/* Important Notice */}
      <div className="rules-notice">
        <div className="notice-icon">!</div>

        <div>
          <h3>Important Notice</h3>
          <p>
            All employees are expected to understand and follow these
            workplace rules and regulations. For any clarification,
            please contact HR or your reporting manager.
          </p>
        </div>
      </div>

      {/* Rules */}
      <div className="rules-list">
        {rules.map((rule) => (
          <div className="rule-card" key={rule.number}>

            <div className="rule-number">
              {rule.number}
            </div>

            <div className="rule-content">
              <h2>{rule.title}</h2>

              <ul>
                {rule.points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

          </div>
        ))}
      </div>

      {/* Footer Notice */}
      <div className="rules-footer">
        <strong>Note:</strong> These are sample company rules and
        regulations for the employee portal. Please refer to the
        official company policy documents for actual policies.
      </div>

    </div>
  );
}

export default RulesRegulations;