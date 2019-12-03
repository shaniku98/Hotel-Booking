<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* themes/contrib/drupal8_zymphonies_theme/templates/layout/page.html.twig */
class __TwigTemplate_4a22a55a01ae9cbcdd34db065b5e46e0da5002b7698cf31825107016e35e1f8e extends \Twig\Template
{
    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->parent = false;

        $this->blocks = [
        ];
        $this->sandbox = $this->env->getExtension('\Twig\Extension\SandboxExtension');
        $tags = ["if" => 74, "for" => 103];
        $filters = ["escape" => 75, "raw" => 104];
        $functions = [];

        try {
            $this->sandbox->checkSecurity(
                ['if', 'for'],
                ['escape', 'raw'],
                []
            );
        } catch (SecurityError $e) {
            $e->setSourceContext($this->getSourceContext());

            if ($e instanceof SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        // line 60
        echo "

<!-- Header and Navbar -->
<header class=\"main-header\">
  <nav class=\"navbar navbar-default\" role=\"navigation\">
    <div class=\"container\">
      <div class=\"row\">
      <div class=\"navbar-header col-md-3\">
        <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\"#main-navigation\">
          <span class=\"sr-only\">Toggle navigation</span>
          <span class=\"icon-bar\"></span>
          <span class=\"icon-bar\"></span>
          <span class=\"icon-bar\"></span>
        </button>
        ";
        // line 74
        if ($this->getAttribute(($context["page"] ?? null), "header", [])) {
            // line 75
            echo "          ";
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "header", [])), "html", null, true);
            echo "
        ";
        }
        // line 77
        echo "      </div>

\t<!-- Test -->
\t";
        // line 80
        if ($this->getAttribute(($context["page"] ?? null), "user_profile", [])) {
            // line 81
            echo "\t  <div class=\"user_profile\">
\t    ";
            // line 82
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "user_profile", [])), "html", null, true);
            echo "
\t  </div>
\t";
        }
        // line 85
        echo "\t<!-- End Test -->

      <!-- Navigation -->
      <div class=\"col-md-12\">
        ";
        // line 89
        if ($this->getAttribute(($context["page"] ?? null), "primary_menu", [])) {
            // line 90
            echo "          ";
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "primary_menu", [])), "html", null, true);
            echo "
        ";
        }
        // line 91
        echo "      
      </div>
      <!--End Navigation -->

      </div>
    </div>
  </nav>

  ";
        // line 99
        if ((($context["is_front"] ?? null) && ($context["show_slideshow"] ?? null))) {
            // line 100
            echo "    <div class=\"container\">
      <div class=\"flexslider\">
        <ul class=\"slides\">
          ";
            // line 103
            $context['_parent'] = $context;
            $context['_seq'] = twig_ensure_traversable(($context["slider_content"] ?? null));
            foreach ($context['_seq'] as $context["_key"] => $context["slider_contents"]) {
                // line 104
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->renderVar($this->sandbox->ensureToStringAllowed($context["slider_contents"]));
                echo "
          ";
            }
            $_parent = $context['_parent'];
            unset($context['_seq'], $context['_iterated'], $context['_key'], $context['slider_contents'], $context['_parent'], $context['loop']);
            $context = array_intersect_key($context, $_parent) + $_parent;
            // line 106
            echo "        </ul>
      </div>
    </div>
  ";
        }
        // line 110
        echo "
</header>
<!--End Header & Navbar -->


<!--Highlighted-->
  ";
        // line 116
        if ($this->getAttribute(($context["page"] ?? null), "highlighted", [])) {
            // line 117
            echo "    <div class=\"container\">
      <div class=\"row\">
        <div class=\"col-md-12\">
          ";
            // line 120
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "highlighted", [])), "html", null, true);
            echo "
        </div>
      </div>
    </div>
  ";
        }
        // line 125
        echo "<!--End Highlighted-->


<!-- Start Top Widget -->
";
        // line 129
        if ((($this->getAttribute(($context["page"] ?? null), "topwidget_first", []) || $this->getAttribute(($context["page"] ?? null), "topwidget_second", [])) || $this->getAttribute(($context["page"] ?? null), "topwidget_third", []))) {
            // line 130
            echo "  <div class=\"topwidget\">
    <!-- start: Container -->
    <div class=\"container\">
      
      <div class=\"row\">
        <!-- Top widget first region -->
        <div class = ";
            // line 136
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["topwidget_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 137
            if ($this->getAttribute(($context["page"] ?? null), "topwidget_first", [])) {
                // line 138
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "topwidget_first", [])), "html", null, true);
                echo "
          ";
            }
            // line 140
            echo "        </div>
        <!-- End top widget third region -->
        <!-- Top widget second region -->
        <div class = ";
            // line 143
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["topwidget_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 144
            if ($this->getAttribute(($context["page"] ?? null), "topwidget_second", [])) {
                // line 145
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "topwidget_second", [])), "html", null, true);
                echo "
          ";
            }
            // line 147
            echo "        </div>
        <!-- End top widget third region -->
        <!-- Top widget third region -->
        <div class = ";
            // line 150
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["topwidget_third_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 151
            if ($this->getAttribute(($context["page"] ?? null), "topwidget_third", [])) {
                // line 152
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "topwidget_third", [])), "html", null, true);
                echo "
          ";
            }
            // line 154
            echo "        </div>
        <!-- End top widget third region -->
      </div>
    </div>
  </div>
";
        }
        // line 160
        echo "<!--End Top Widget -->


<!-- Page Title -->
";
        // line 164
        if (($this->getAttribute(($context["page"] ?? null), "page_title", []) &&  !($context["is_front"] ?? null))) {
            // line 165
            echo "  <div id=\"page-title\">
    <div id=\"page-title-inner\">
      <!-- start: Container -->
      <div class=\"container\">
        ";
            // line 169
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "page_title", [])), "html", null, true);
            echo "
      </div>
    </div>
  </div>
";
        }
        // line 174
        echo "<!-- End Page Title -- >


<!-- layout -->
<div id=\"wrapper\">
  <!-- start: Container -->
  <div class=\"container\">
    
    <!--Content top-->
      ";
        // line 183
        if ($this->getAttribute(($context["page"] ?? null), "content_top", [])) {
            // line 184
            echo "        <div class=\"row\">
          ";
            // line 185
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "content_top", [])), "html", null, true);
            echo "
        </div>
      ";
        }
        // line 188
        echo "    <!--End Content top-->
    
    <!--start:content -->
    <div class=\"row\">
      <div class=\"col-md-12\">";
        // line 192
        echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "breadcrumb", [])), "html", null, true);
        echo "</div>
    </div>

    <div class=\"row layout\">
      <!--- Start Left SideBar -->
      ";
        // line 197
        if ($this->getAttribute(($context["page"] ?? null), "sidebar_first", [])) {
            // line 198
            echo "        <div class=\"sidebar\" >
          <div class = ";
            // line 199
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["sidebarfirst"] ?? null)), "html", null, true);
            echo " >
            ";
            // line 200
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "sidebar_first", [])), "html", null, true);
            echo "
          </div>
        </div>
      ";
        }
        // line 204
        echo "      <!---End Right SideBar -->

      <!--- Start content -->
      ";
        // line 207
        if ($this->getAttribute(($context["page"] ?? null), "content", [])) {
            // line 208
            echo "        <div class=\"content_layout\">
          <div class=";
            // line 209
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["contentlayout"] ?? null)), "html", null, true);
            echo ">
            ";
            // line 210
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "content", [])), "html", null, true);
            echo "
          </div>
        </div>
      ";
        }
        // line 214
        echo "      <!---End content -->

      <!--- Start Right SideBar -->
      ";
        // line 217
        if ($this->getAttribute(($context["page"] ?? null), "sidebar_second", [])) {
            // line 218
            echo "        <div class=\"sidebar\">
          <div class=";
            // line 219
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["sidebarsecond"] ?? null)), "html", null, true);
            echo ">
            ";
            // line 220
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "sidebar_second", [])), "html", null, true);
            echo "
          </div>
        </div>
      ";
        }
        // line 224
        echo "      <!---End Right SideBar -->
      
    </div>
    <!--End Content -->

    <!--Start Content Bottom-->
    ";
        // line 230
        if ($this->getAttribute(($context["page"] ?? null), "content_bottom", [])) {
            // line 231
            echo "      <div class=\"row\">
        ";
            // line 232
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "content_bottom", [])), "html", null, true);
            echo "
      </div>
    ";
        }
        // line 235
        echo "    <!--End Content Bottom-->
  </div>
</div>
<!-- End layout -->


<!-- Start Middle Widget -->
";
        // line 242
        if ((($this->getAttribute(($context["page"] ?? null), "middle_first", []) || $this->getAttribute(($context["page"] ?? null), "middle_second", [])) || $this->getAttribute(($context["page"] ?? null), "middle_third", []))) {
            // line 243
            echo "  <div class=\"middlewidget\">
    <!-- start: Container -->
    <div class=\"container\">
      
      <div class=\"row\">
        <!-- Top widget first region -->
        <div class = ";
            // line 249
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["middle_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 250
            if ($this->getAttribute(($context["page"] ?? null), "middle_first", [])) {
                // line 251
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "middle_first", [])), "html", null, true);
                echo "
          ";
            }
            // line 253
            echo "        </div>
        <!-- End top widget third region -->
        <!-- Top widget second region -->
        <div class = ";
            // line 256
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["middle_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 257
            if ($this->getAttribute(($context["page"] ?? null), "middle_second", [])) {
                // line 258
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "middle_second", [])), "html", null, true);
                echo "
          ";
            }
            // line 260
            echo "        </div>
        <!-- End top widget third region -->
        <!-- Top widget third region -->
        <div class = ";
            // line 263
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["middle_third_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 264
            if ($this->getAttribute(($context["page"] ?? null), "middle_third", [])) {
                // line 265
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "middle_third", [])), "html", null, true);
                echo "
          ";
            }
            // line 267
            echo "        </div>
        <!-- End top widget third region -->
      </div>
    </div>
  </div>
";
        }
        // line 273
        echo "<!--End Top Widget -->


<!-- Start bottom -->
";
        // line 277
        if ((($this->getAttribute(($context["page"] ?? null), "bottom_first", []) || $this->getAttribute(($context["page"] ?? null), "bottom_second", [])) || $this->getAttribute(($context["page"] ?? null), "bottom_third", []))) {
            // line 278
            echo "  <div class=\"bottom-widgets\">
    <!-- Start Container -->
    <div class=\"container\">
      
      <div class=\"row\">

        <!-- Start Bottom First Region -->
        <div class = ";
            // line 285
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["bottom_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 286
            if ($this->getAttribute(($context["page"] ?? null), "bottom_first", [])) {
                // line 287
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "bottom_first", [])), "html", null, true);
                echo "
          ";
            }
            // line 289
            echo "        </div>
        <!-- End Bottom First Region -->

        <!-- Start Bottom Second Region -->
        <div class = ";
            // line 293
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["bottom_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 294
            if ($this->getAttribute(($context["page"] ?? null), "bottom_second", [])) {
                // line 295
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "bottom_second", [])), "html", null, true);
                echo "
          ";
            }
            // line 297
            echo "        </div>
        <!-- End Bottom Second Region -->

        <!-- Start Bottom third Region -->
        <div class = ";
            // line 301
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["bottom_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 302
            if ($this->getAttribute(($context["page"] ?? null), "bottom_third", [])) {
                // line 303
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "bottom_third", [])), "html", null, true);
                echo "
          ";
            }
            // line 305
            echo "        </div>
        <!-- End Bottom Third Region -->

        <div class = ";
            // line 308
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["bottom_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 309
            if ($this->getAttribute(($context["page"] ?? null), "bottom_forth", [])) {
                // line 310
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "bottom_forth", [])), "html", null, true);
                echo "
          ";
            }
            // line 312
            echo "        </div>

      </div>
    </div>
  </div>
";
        }
        // line 318
        echo "<!--End Bottom -->

<!-- Start Footer Menu -->
";
        // line 321
        if ($this->getAttribute(($context["page"] ?? null), "footer_menu", [])) {
            // line 322
            echo "  <div class=\"footer-menu\">
    <div class=\"container\">
      <div class=\"row\">
        <div class=\"col-sm-6 col-md-6\">
          ";
            // line 326
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "footer_menu", [])), "html", null, true);
            echo "
        </div>
        ";
            // line 328
            if (($context["show_social_icon"] ?? null)) {
                // line 329
                echo "        <div class=\"col-sm-6 col-md-6\">
          <div class=\"social-media\">
            ";
                // line 331
                if (($context["facebook_url"] ?? null)) {
                    // line 332
                    echo "              <a href=\"";
                    echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["facebook_url"] ?? null)), "html", null, true);
                    echo "\"  class=\"facebook\" target=\"_blank\" ><i class=\"fab fa-facebook-f\"></i></a>
            ";
                }
                // line 334
                echo "            ";
                if (($context["google_plus_url"] ?? null)) {
                    // line 335
                    echo "              <a href=\"";
                    echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["google_plus_url"] ?? null)), "html", null, true);
                    echo "\"  class=\"google-plus\" target=\"_blank\" ><i class=\"fab fa-google-plus-g\"></i></a>
            ";
                }
                // line 337
                echo "            ";
                if (($context["twitter_url"] ?? null)) {
                    // line 338
                    echo "              <a href=\"";
                    echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["twitter_url"] ?? null)), "html", null, true);
                    echo "\" class=\"twitter\" target=\"_blank\" ><i class=\"fab fa-twitter\"></i></a>
            ";
                }
                // line 340
                echo "            ";
                if (($context["linkedin_url"] ?? null)) {
                    // line 341
                    echo "              <a href=\"";
                    echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["linkedin_url"] ?? null)), "html", null, true);
                    echo "\" class=\"linkedin\" target=\"_blank\"><i class=\"fab fa-linkedin-in\"></i></a>
            ";
                }
                // line 343
                echo "            ";
                if (($context["pinterest_url"] ?? null)) {
                    // line 344
                    echo "              <a href=\"";
                    echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["pinterest_url"] ?? null)), "html", null, true);
                    echo "\" class=\"pinterest\" target=\"_blank\" ><i class=\"fab fa-pinterest-p\"></i></a>
            ";
                }
                // line 346
                echo "            ";
                if (($context["rss_url"] ?? null)) {
                    // line 347
                    echo "              <a href=\"";
                    echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["rss_url"] ?? null)), "html", null, true);
                    echo "\" class=\"rss\" target=\"_blank\" ><i class=\"fas fa-rss\"></i></a>
            ";
                }
                // line 349
                echo "          </div>
        </div>
        ";
            }
            // line 352
            echo "      </div>
    </div>
  </div>
";
        }
        // line 356
        echo "<!-- End Footer Menu -->

<!-- start: Footer -->
";
        // line 359
        if ((($this->getAttribute(($context["page"] ?? null), "footer_first", []) || $this->getAttribute(($context["page"] ?? null), "footer_second", [])) || $this->getAttribute(($context["page"] ?? null), "footer_third", []))) {
            // line 360
            echo "  <div class=\"footerwidget\">
    <div class=\"container\">
      
      <div class=\"row\">
        
        <!-- Start Footer First Region -->
        <div class = ";
            // line 366
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["footer_third_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 367
            if ($this->getAttribute(($context["page"] ?? null), "footer_first", [])) {
                // line 368
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "footer_first", [])), "html", null, true);
                echo "
          ";
            }
            // line 370
            echo "        </div>
        <!-- End Footer First Region -->

        <!-- Start Footer Second Region -->
        <div class = ";
            // line 374
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["footer_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 375
            if ($this->getAttribute(($context["page"] ?? null), "footer_second", [])) {
                // line 376
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "footer_second", [])), "html", null, true);
                echo "
          ";
            }
            // line 378
            echo "        </div>
        <!-- End Footer Second Region -->

        <!-- Start Footer third Region -->
        <div class = ";
            // line 382
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["footer_class"] ?? null)), "html", null, true);
            echo ">
          ";
            // line 383
            if ($this->getAttribute(($context["page"] ?? null), "footer_third", [])) {
                // line 384
                echo "            ";
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "footer_third", [])), "html", null, true);
                echo "
          ";
            }
            // line 386
            echo "        </div>
        <!-- End Footer Third Region -->
      </div>
    </div>
  </div>
";
        }
        // line 392
        echo "<!--End Footer -->


<!-- Google map -->
";
        // line 396
        if ((($context["is_front"] ?? null) && $this->getAttribute(($context["page"] ?? null), "google_map", []))) {
            // line 397
            echo "  <div class=\"google_map\">
    ";
            // line 398
            echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed($this->getAttribute(($context["page"] ?? null), "google_map", [])), "html", null, true);
            echo "
  </div>
";
        }
        // line 401
        echo "<!-- End Google map -->


";
        // line 404
        if ((($context["copyright_text"] ?? null) || ($context["show_credit_link"] ?? null))) {
            // line 405
            echo "<div class=\"copyright\">
  <div class=\"container\">
    <div class=\"row\">

      <!-- Copyright -->
      <div class=\"col-sm-6 col-md-6\">
        ";
            // line 411
            if (($context["copyright_text"] ?? null)) {
                echo "        
          <p>";
                // line 412
                echo $this->env->getExtension('Drupal\Core\Template\TwigExtension')->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["copyright_text"] ?? null)), "html", null, true);
                echo "</p>        
        ";
            }
            // line 414
            echo "      </div>
      <!-- End Copyright -->

      <!-- Credit link -->
      ";
            // line 418
            if (($context["show_credit_link"] ?? null)) {
                // line 419
                echo "        <div class=\"col-sm-6 col-md-6\">
          <p class=\"credit-link\">Designed & Developed by  <a href=\"https://in.linkedin.com/in/shani-maurya-b51b27118\" target=\"_blank\"><strong>SHANI MAURYA</strong></a></p>
        </div>
      ";
            }
            // line 423
            echo "      <!-- End Credit link -->
      
    </div>
  </div>
</div>
";
        }
        // line 429
        echo "


";
    }

    public function getTemplateName()
    {
        return "themes/contrib/drupal8_zymphonies_theme/templates/layout/page.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  758 => 429,  750 => 423,  744 => 419,  742 => 418,  736 => 414,  731 => 412,  727 => 411,  719 => 405,  717 => 404,  712 => 401,  706 => 398,  703 => 397,  701 => 396,  695 => 392,  687 => 386,  681 => 384,  679 => 383,  675 => 382,  669 => 378,  663 => 376,  661 => 375,  657 => 374,  651 => 370,  645 => 368,  643 => 367,  639 => 366,  631 => 360,  629 => 359,  624 => 356,  618 => 352,  613 => 349,  607 => 347,  604 => 346,  598 => 344,  595 => 343,  589 => 341,  586 => 340,  580 => 338,  577 => 337,  571 => 335,  568 => 334,  562 => 332,  560 => 331,  556 => 329,  554 => 328,  549 => 326,  543 => 322,  541 => 321,  536 => 318,  528 => 312,  522 => 310,  520 => 309,  516 => 308,  511 => 305,  505 => 303,  503 => 302,  499 => 301,  493 => 297,  487 => 295,  485 => 294,  481 => 293,  475 => 289,  469 => 287,  467 => 286,  463 => 285,  454 => 278,  452 => 277,  446 => 273,  438 => 267,  432 => 265,  430 => 264,  426 => 263,  421 => 260,  415 => 258,  413 => 257,  409 => 256,  404 => 253,  398 => 251,  396 => 250,  392 => 249,  384 => 243,  382 => 242,  373 => 235,  367 => 232,  364 => 231,  362 => 230,  354 => 224,  347 => 220,  343 => 219,  340 => 218,  338 => 217,  333 => 214,  326 => 210,  322 => 209,  319 => 208,  317 => 207,  312 => 204,  305 => 200,  301 => 199,  298 => 198,  296 => 197,  288 => 192,  282 => 188,  276 => 185,  273 => 184,  271 => 183,  260 => 174,  252 => 169,  246 => 165,  244 => 164,  238 => 160,  230 => 154,  224 => 152,  222 => 151,  218 => 150,  213 => 147,  207 => 145,  205 => 144,  201 => 143,  196 => 140,  190 => 138,  188 => 137,  184 => 136,  176 => 130,  174 => 129,  168 => 125,  160 => 120,  155 => 117,  153 => 116,  145 => 110,  139 => 106,  130 => 104,  126 => 103,  121 => 100,  119 => 99,  109 => 91,  103 => 90,  101 => 89,  95 => 85,  89 => 82,  86 => 81,  84 => 80,  79 => 77,  73 => 75,  71 => 74,  55 => 60,);
    }

    /** @deprecated since 1.27 (to be removed in 2.0). Use getSourceContext() instead */
    public function getSource()
    {
        @trigger_error('The '.__METHOD__.' method is deprecated since version 1.27 and will be removed in 2.0. Use getSourceContext() instead.', E_USER_DEPRECATED);

        return $this->getSourceContext()->getCode();
    }

    public function getSourceContext()
    {
        return new Source("", "themes/contrib/drupal8_zymphonies_theme/templates/layout/page.html.twig", "/var/www/html/hotelmanagement/themes/contrib/drupal8_zymphonies_theme/templates/layout/page.html.twig");
    }
}
