/// <reference types="cypress" />

describe('page - politician details', () => {
  it.only('page with questionnaire', () => {
    cy.visit('/politicians/person/adam---schiff')

    cy.get('h2').contains('Candidate questionnaire')

    cy.get('[data-testid="questionnaire-trigger"]').as('questionnaireTrigger').scrollIntoView()
    cy.get('@questionnaireTrigger').should('be.visible').click()

    cy.get('div')
      .should(
        'contain',
        'Do you have experience buying, selling, or using blockchain technology assets or investment tools?',
      )
      .find('strong')
      .should('contain', 'A: No')

    cy.get('div')
      .should(
        'contain',
        'Do you believe blockchain technology and digital assets, including cryptocurrency like Bitcoin, will play a major role in the next wave of technological innovation globally?',
      )
      .find('strong')
      .should('contain', 'A: Yes')

    cy.get('div')
      .should(
        'contain',
        'Do you believe the American cryptocurrency and digital asset industry is driving economic growth and supporting millions of jobs across the country?',
      )
      .find('strong')
      .should('contain', 'A: Yes')

    cy.get('div')
      .should(
        'contain',
        'Do you believe US competitiveness and American national security are at risk if the digital asset industry is pushed overseas?',
      )
      .find('strong')
      .should('contain', 'A: Yes')

    cy.get('div')
      .should(
        'contain',
        'Do you believe it is important for the United States to modernize the regulatory environment for crypto and digital assets to ensure proper consumer protection while also fostering responsible innovation?',
      )
      .find('strong')
      .should('contain', 'A: Yes')

    cy.get('div')
      .should(
        'contain',
        'If you are currently a Member of Congress or are elected to Congress, would you vote in favor of legislation that creates a comprehensive regulatory framework for digital assets like HR 4763, the “Financial Innovation and Technology for the 21st Century Act”, a bipartisan bill?',
      )
      .find('strong')
      .should('contain', 'A: Yes')

    cy.get('div')
      .should(
        'contain',
        'If you are currently a Member of Congress or are elected to Congress, would you vote in favor of legislation to create clear rules for payment stablecoins (i.e., digital assets that are redeemable for U.S. dollars 1:1) like HR 4766, “Clarity for Payment Stablecoins Act of 2023”, a bipartisan bill?',
      )
      .find('strong')
      .should('contain', 'A: Yes')

    cy.get('div')
      .should(
        'contain',
        'Please share any other positions or opinions that you have on how crypto and digital assets should be regulated?',
      )
      .find('strong')
      .should(
        'contain',
        "A: While I'm still reviewing the FIT for the 21st Century Act, I agree we need to develop a comprehensive regulatory framework to ensure that these companies and jobs stay here and grow here, and that the U.S. remains a global leader in these important new technologies. Otherwise, we risk losing jobs to workers overseas, where these technologies will face less oversight and transparency.",
      )
  })

  it('page with questionnaire and hashing deeplink', () => {
    cy.visit('/politicians/person/adam---schiff#questionnaire')

    cy.get('h2').contains('Candidate questionnaire')

    cy.contains(
      'Do you have experience buying, selling, or using blockchain technology assets or investment tools?',
    )
  })

  it('page with questionnaire and hashing deeplink using vanity url', () => {
    cy.visit('/politicians/person/adam---schiff/questionnaire')

    cy.get('h2').contains('Candidate questionnaire')

    cy.contains(
      'Do you have experience buying, selling, or using blockchain technology assets or investment tools?',
    )
  })

  it('page with no questionnaire', () => {
    /* Using Joe Biden for a case in which the politician hasn't answered the questionnaire yet.
    If this test fails, two cases happen:
    - we changed something in the code that is rendering the questionnaire without response
    - or he has answered the questionnaire. If the latter, find someone else.
    */
    cy.visit('/politicians/person/joseph---biden')

    cy.get('h2').contains('Candidate Questionnaire').should('not.exist')
  })
})
