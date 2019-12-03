<?php
	namespace Drupal\custom_form_redirect\Form;
	use Drupal\Core\Form\FormBase;
	use Drupal\Core\Form\FormStateInterface;
	use Symfony\Component\HttpFoundation\Request;
	use Drupal\Core\Url;

class CustomForm extends FormBase
{
	public function getFormId()
	{
		return 'custom_form';
	}
	public function buildForm(array $form, FormStateInterface $form_state)
	{
		// $form['visitor_name'] = [
		// 	'#type' => 'textfield',
		// 	'#title' => $this->t('Enter Your Name:'),
		// 	'#required' => TRUE,
		// ];
		$form['arriving_date'] = [
			'#type' => 'date',
          	'#title' => $this->t('Arriving Date:'),
          	'#required' => TRUE,
          	'#format' => 'm/d/Y',
          	'#attributes' =>  [
             'min' =>  \Drupal::service('date.formatter')->format(REQUEST_TIME, 'custom', 'Y-m-d'),
            ],
		];
		$form['departure_date'] = [
			'#type' => 'date',
          	'#title' => $this->t('Departure Date:'),
            '#date_format' => 'Y-m-d',
            '#date_year_range' => '-80:0',
            '#required' => TRUE,
            '#attributes' =>  [
             'min' =>  \Drupal::service('date.formatter')->format(REQUEST_TIME, 'custom', 'Y-m-d'),
            ],
        ];
		$form['submit'] = [
			'#type' => 'submit',
          	'#value' => $this->t('CheckAvailability'),
		];
		return $form;
	}

	public function validateForm(array &$form, FormStateInterface $form_state)
	{
		if($form_state->getValue('arriving_date') >= $form_state->getValue('departure_date'))
		{
			$form_state->setErrorByName('departure_date', $this->t('Arriving and Departure Date should not be same...!!!'));
		}
	} 

	public function submitForm(array &$form, FormStateInterface $form_state)
	{
		// $name = $form_state->getValue('visitor_name');
		$arrivingdate = $form_state->getValue('arriving_date');
		$departuredate = $form_state->getValue('departure_date');

        $params['query'] = [
            // 'name' => $name,
            'arivedate' => $arrivingdate,
            'departuredate' => $departuredate,
        ];
        // set relative internal path
        $redirect_path = "/book-room";
        $form_state->setRedirectUrl(Url::fromUri('internal:' . $redirect_path, $params));	

		// set relative internal path
		// $redirect_path = "/book-room";
		// $url = url::fromUserInput($redirect_path);

		// // set redirect
		// $form_state->setRedirectUrl($url);
		// drupal_set_message('available rooms are: ');
	}
}