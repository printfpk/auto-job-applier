// This file defines keyword-based rules for handling exceptions in form fields.

const ExceptionRules = {
    // Rules for Input fields (Text/Number)
    inputs: [
        // Personal Identity
        {
            keywords: ['first name', 'firstname'],
            value: 'Prashanta Kumar',
            log: 'Auto-filled First Name'
        },
        {
            keywords: ['last name', 'lastname', 'surname'],
            value: 'Mohanty',
            log: 'Auto-filled Last Name'
        },
        {
            keywords: ['full name', 'fullname'],
            value: 'Prashanta Kumar Mohanty',
            log: 'Auto-filled Full Name'
        },
        {
            keywords: ['email', 'e-mail'],
            value: 'printfrpk@gmail.com',
            log: 'Auto-filled Email'
        },
        {
            keywords: ['headline', 'title'],
            value: 'MERN Stack Developer',
            log: 'Auto-filled Headline'
        },

        // Contact & Location
        {
            keywords: ['phone', 'mobile', 'cell', 'contact'],
            value: '+919090578237',
            log: 'Auto-filled personal phone number'
        },
        {
            keywords: ['city', 'town', 'location'],
            value: 'Roorkee',
            log: 'Auto-filled City'
        },
        {
            keywords: ['state', 'province'],
            value: 'Uttarakhand',
            log: 'Auto-filled State'
        },
        {
            keywords: ['zip', 'postal', 'pin code', 'pincode'],
            value: '247667',
            log: 'Auto-filled Zip Code'
        },
        {
            keywords: ['address', 'street'],
            value: 'Roorkee, India',
            log: 'Auto-filled Address'
        },

        // URLs
        {
            keywords: ['linkedin'],
            value: 'https://www.linkedin.com/in/prashant-kumar',
            log: 'Auto-filled LinkedIn URL'
        },
        {
            keywords: ['github', 'git'],
            value: 'https://github.com/printfpk',
            log: 'Auto-filled GitHub URL'
        },
        {
            keywords: ['website', 'portfolio', 'url', 'blog', 'link'],
            value: 'https://prashant-tau.vercel.app',
            log: 'Auto-filled Portfolio URL'
        },

        // Experience / Numerics
        {
            keywords: ['years', 'experience', 'months', 'duration'],
            value: '0',
            log: 'Auto-filled experience years'
        },
        {
            keywords: ['ctc', 'salary', 'pay', 'expectations', 'remuneration', 'wage'],
            value: '0',
            log: 'Auto-filled salary expectation'
        },
        {
            keywords: ['notice', 'period', 'soon', 'start'],
            value: '0',
            log: 'Auto-filled notice period as 0 days'
        },
        {
            keywords: ['gpa', 'cgpa', 'grade'],
            value: '7.76',
            log: 'Auto-filled CGPA'
        }
    ],

    // Rules for Select Dropdowns
    selects: [
        // Work Authorization & Visa (User said YES to sponsorship)
        {
            keywords: ['authorization', 'authorized', 'permit', 'eligible'],
            options: ['yes', 'i am authorized', 'authorized'],
            log: 'Selected Work Authorization: Yes'
        },
        {
            keywords: ['sponsorship', 'visa', 'require'],
            options: ['yes', 'willing to sponsor', 'require sponsorship'], // User asked for YES
            log: 'Selected Visa Sponsorship: Yes'
        },

        // Education
        {
            keywords: ['education', 'degree', 'qualification'],
            options: ['master', 'mca', 'bachelor', 'bsc', 'graduate'],
            log: 'Selected Education Level'
        },

        // Availability
        {
            keywords: ['start', 'availability', 'join'],
            options: ['immediately', 'immediate', 'now', 'within 2 weeks', 'yes'],
            log: 'Selected Immediate Availability'
        },

        // English Proficiency
        {
            keywords: ['english', 'proficiency', 'language'],
            options: ['professional', 'native', 'fluent', 'bilingual'],
            log: 'Selected English proficiency'
        },

        // Demographics - Prefer not to say
        {
            keywords: ['gender', 'sex'],
            options: ['prefer not to say', 'decline', 'male', 'man'],
            log: 'Selected Gender preference'
        },
        {
            keywords: ['race', 'ethnicity'],
            options: ['prefer not to say', 'decline', 'asian'],
            log: 'Selected Race/Ethnicity preference'
        },
        {
            keywords: ['veteran'],
            options: ['prefer not to say', 'decline', 'no', 'i am not'],
            log: 'Selected Veteran status'
        },
        {
            keywords: ['disability'],
            options: ['prefer not to say', 'decline', 'no', 'i do not'],
            log: 'Selected Disability status'
        },

        // Location
        {
            keywords: ['country', 'region'],
            options: ['india', 'united states', 'usa', 'united kingdom'],
            log: 'Selected Country'
        }
    ],

    // Rules for Checkboxes
    checkboxes: [
        {
            keywords: ['policy', 'terms', 'agree', 'consent', 'confirm', 'acknowledge', 'i understand', 'background', 'drug', 'certify', 'declare'],
            action: 'check',
            log: 'Checked agreement/policy box'
        },
        {
            keywords: ['remote', 'hybrid'],
            action: 'check',
            log: 'Checked Remote/Hybrid option' // Usually checking it means "Yes I am interested"
        }
    ]
};

module.exports = ExceptionRules;
